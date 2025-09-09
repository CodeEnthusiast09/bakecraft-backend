import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Subscription } from '../../public/entities/subscription.entity';
import { Plan } from '../../public/entities/plan.entity';
import { Tenant } from '../entities/tenant.entity';
import { PaystackClient } from '../paystack/paystack-client';
import { InitializeSubscriptionDto } from './dtos/initialize-subscription.dto';
import { InitializeSubscriptionResponseDto } from './dtos/responses/init-subscription-response.dto';
import { SubscriptionStatus, TenantStatus } from '../../../common/enums';
import { v4 as uuidv4 } from 'uuid';
import {
  PaystackCustomer,
  PaystackPlan,
  PaystackWebhookPayload,
  ResponseData,
  SubscriptionData,
} from 'src/types/paystack-api-types';
import { PaystackEvents } from 'src/types/enums';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SubscriptionService {
  private readonly subscriptionRepository: Repository<Subscription>;

  private readonly planRepository: Repository<Plan>;

  private readonly tenantRepository: Repository<Tenant>;

  private readonly paystackClient: PaystackClient;

  constructor(
    @InjectRepository(Subscription)
    subscriptionRepository: Repository<Subscription>,

    @InjectRepository(Plan)
    planRepository: Repository<Plan>,

    @InjectRepository(Tenant)
    tenantRepository: Repository<Tenant>,

    paystackClient: PaystackClient,
  ) {
    this.subscriptionRepository = subscriptionRepository;
    this.planRepository = planRepository;
    this.tenantRepository = tenantRepository;
    this.paystackClient = paystackClient;
  }

  async initializeSubscription(
    initializeSubscriptionDto: InitializeSubscriptionDto,
  ): Promise<InitializeSubscriptionResponseDto> {
    const { tenant_slug, plan_code, email } = initializeSubscriptionDto;

    // Find tenant
    const tenant = await this.tenantRepository.findOne({
      where: { slug: tenant_slug },
      relations: ['subscription'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if tenant already has an active subscription
    if (
      tenant.subscription &&
      tenant.subscription.status === SubscriptionStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'Tenant already has an active subscription',
      );
    }

    // Find plan
    const plan = await this.planRepository.findOne({
      where: { plan_code, active: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Create or find customer in Paystack
    let customer: PaystackCustomer;

    try {
      customer = await this.paystackClient.findCustomerByEmail(email);
    } catch {
      // Customer doesn't exist, create one
      customer = await this.paystackClient.createCustomer({
        firstName: tenant.company_name.split(' ')[0],
        lastName:
          tenant.company_name.split(' ').slice(1).join(' ') || 'Company',
        email,
        phoneNumber: tenant.company_phone_number,
      });
    }

    // Generate unique reference
    const reference = uuidv4();

    // Create subscription record
    const subscription = this.subscriptionRepository.create({
      tenant,
      plan,
      reference,
      customer_email: email,
      customer_code: customer.customer_code,
      status: SubscriptionStatus.PENDING,
    });

    await this.subscriptionRepository.save(subscription);

    // Initialize payment with Paystack
    const paymentSession = await this.paystackClient.initializeSubscription(
      email,
      plan.plan_code,
      reference,
    );

    return {
      authorization_url: paymentSession.authorizationUrl,
      access_code: paymentSession.accessCode,
      reference: paymentSession.reference,
    };
  }

  async handleWebhook(event: PaystackWebhookPayload): Promise<void> {
    const { event: eventType, data } = event;

    console.log(`Received webhook event: ${eventType}`);

    switch (eventType) {
      case PaystackEvents.PAYMENT_SUCCESSFUL: // charge.success
        await this.handleSuccessfulPayment(data);
        break;
      case PaystackEvents.SUBSCRIPTION_CREATE:
        await this.handleSubscriptionCreated(data);
        break;
      case PaystackEvents.INVOICE_UPDATED:
        await this.handleInvoiceUpdated(data);
        break;
      case PaystackEvents.SUBSCRIPTION_NOT_RENEW:
        await this.handleSubscriptionDisabled(data);
        break;
      case PaystackEvents.INVOICE_FAILED:
        await this.handlePaymentFailed(data);
        break;
      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  private async handleSuccessfulPayment(data: PaystackWebhookPayload['data']) {
    const reference = data.reference;

    if (!reference) {
      console.error('Transaction webhook has no reference');
      return;
    }

    console.log(`Processing successful payment for reference: ${reference}`);

    const subscription = await this.subscriptionRepository.findOne({
      where: { reference },
      relations: ['tenant', 'plan'],
    });

    if (!subscription || subscription.status !== SubscriptionStatus.PENDING) {
      console.log(`No pending subscription found for reference: ${reference}`);
      return;
    }

    // Verify transaction
    let transaction: ResponseData;
    try {
      transaction = await this.paystackClient.verifyTransaction(reference);
      console.log(`Transaction verified successfully`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Failed to verify transaction: ${err.message}`);
      } else {
        console.error('Failed to verify transaction', err);
      }
      return;
    }

    const authorizationCode = transaction.authorization?.authorization_code;

    console.log(authorizationCode);

    if (!authorizationCode) {
      console.error('No authorization_code in transaction verification');
      return;
    }

    // Since we initialized with a plan, Paystack automatically created a subscription
    // Let's try to find it by fetching customer subscriptions

    let paystackSubscriptions: SubscriptionData[] = [];

    let customerSubscription: SubscriptionData | undefined;

    try {
      const subscriptionsResult = await this.paystackClient.listSubscriptions(
        subscription.customer_email,
      );
      paystackSubscriptions = subscriptionsResult || [];

      console.log(
        `Found ${paystackSubscriptions.length} subscriptions for customer`,
      );

      customerSubscription = paystackSubscriptions.find((sub) => {
        const customerPlans =
          sub.plan.plan_code === subscription.plan.plan_code;

        return customerPlans;
      });

      if (customerSubscription) {
        console.log(
          `Found matching subscription: ${customerSubscription.subscription_code}`,
        );
      } else {
        console.log('No matching subscription found in Paystack');
      }
    } catch (err: unknown) {
      console.error('Failed to fetch customer subscriptions:', err);
    }

    // Calculate period dates based on plan interval
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    const nextPaymentDate = new Date();

    // Get plan details to determine interval
    let planDetails: PaystackPlan;
    try {
      planDetails = await this.paystackClient.getPlan(
        subscription.plan.plan_code,
      );
      const planInterval = planDetails.interval || 'monthly';

      console.log(`Plan interval: ${planInterval}`);

      switch (planInterval.toLowerCase()) {
        case 'daily':
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 1);
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);
          break;
        case 'weekly':
          currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 7);
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
          break;
        case 'monthly':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          break;
        case 'quarterly':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
          break;
        case 'biannually':
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 6);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 6);
          break;
        case 'annually':
          currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
          break;
        default:
          // Default to monthly
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }
    } catch (err) {
      console.error(
        'Failed to get plan details, defaulting to monthly interval:',
        err,
      );
      // Default to monthly
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }

    // Update all subscription fields
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.authorization_code = authorizationCode;
    subscription.current_period_start = currentPeriodStart;
    subscription.current_period_end = currentPeriodEnd;
    subscription.next_payment_date = nextPaymentDate;

    // Use Paystack subscription data if available (more accurate)
    if (customerSubscription) {
      subscription.subscription_code = customerSubscription.subscription_code;

      if (customerSubscription.next_payment_date) {
        subscription.next_payment_date = new Date(
          customerSubscription.next_payment_date,
        );
      }
      if (customerSubscription.createdAt) {
        subscription.current_period_start = new Date(
          customerSubscription.createdAt,
        );
      }
    } else if (paystackSubscriptions.length > 0) {
      // fallback: pick the first one if nothing matched but Paystack returned subs
      subscription.subscription_code =
        paystackSubscriptions[0].subscription_code;
      console.log(
        `Fallback: using subscription_code from Paystack: ${subscription.subscription_code}`,
      );
    }

    // Add metadata from the transaction/webhook
    if (data.metadata) {
      subscription.metadata = data.metadata;
    } else if (transaction.metadata) {
      subscription.metadata = transaction.metadata;
    }

    // Save the updated subscription
    await this.subscriptionRepository.save(subscription);

    // Update tenant status to ACTIVE
    subscription.tenant.status = TenantStatus.ACTIVE;
    await this.tenantRepository.save(subscription.tenant);

    console.log('=== SUBSCRIPTION UPDATED ===');
    console.log(`Tenant: ${subscription.tenant.slug}`);
    console.log(`Status: ${subscription.status}`);
    console.log(
      `Subscription Code: ${subscription.subscription_code || 'Not available'}`,
    );
    console.log(`Authorization Code: ${subscription.authorization_code}`);
    console.log(
      `Current Period Start: ${subscription.current_period_start?.toISOString?.() ?? subscription.current_period_start}`,
    );
    console.log(
      `Current Period End: ${subscription.current_period_end?.toISOString?.() ?? subscription.current_period_end}`,
    );
    console.log(
      `Next Payment Date: ${subscription.next_payment_date?.toISOString?.() ?? subscription.next_payment_date}`,
    );
    console.log('=== END SUBSCRIPTION UPDATE ===');
  }

  private async handleSubscriptionCreated(
    data: PaystackWebhookPayload['data'],
  ): Promise<void> {
    // For subscription.create events, we need to find the subscription differently
    // since there might not be a reference field. Try multiple approaches:

    let subscription: Subscription | null = null;

    // Try by subscription_code first (most reliable for subscription events)

    if (data.subscription_code) {
      console.log(`Subscription code: ${data.subscription_code}`);
      subscription = await this.subscriptionRepository.findOne({
        where: { subscription_code: data.subscription_code },
        relations: ['tenant', 'plan'],
      });
    }

    if (!subscription && data.customer?.email) {
      subscription = await this.subscriptionRepository.findOne({
        where: { customer_email: data.customer.email },
        relations: ['tenant', 'plan'],
      });
    }

    if (!subscription) {
      console.log(`No subscription found for subscription.create event`);
      console.log(`Subscription code: ${data.subscription_code}`);
      console.log(`Reference: ${data.reference || 'Not provided'}`);
      console.log(`Customer email: ${data.customer?.email || 'Not provided'}`);
      return;
    }

    if (!subscription) {
      console.log(`No subscription found for reference: ${data.reference}`);
      return;
    }

    if (subscription) {
      // subscription.status = SubscriptionStatus.ACTIVE;

      if (data.subscription_code) {
        subscription.subscription_code = data.subscription_code;
      }

      if (data.authorization?.authorization_code) {
        subscription.authorization_code = data.authorization.authorization_code;
      }

      if (data.createdAt) {
        subscription.current_period_start = new Date(data.createdAt);
      }

      if (data.next_payment_date) {
        subscription.next_payment_date = new Date(data.next_payment_date);
      }

      if (subscription.next_payment_date) {
        subscription.current_period_end = new Date(
          subscription.next_payment_date.getTime() - 24 * 60 * 60 * 1000,
        ); // Day before next payment
      }

      await this.subscriptionRepository.save(subscription);

      // Update tenant status
      // subscription.tenant.status = TenantStatus.ACTIVE;

      // await this.tenantRepository.save(subscription.tenant);

      console.log(
        `Subscription created and tenant activated: ${subscription.tenant.slug}`,
      );
    } else if (!data.reference) {
      console.error('Transaction webhook has no reference');
      return;
    }
  }

  private async handleInvoiceUpdated(
    data: PaystackWebhookPayload['data'],
  ): Promise<void> {
    console.log(`Processing invoice update for reference: ${data.reference}`);

    // Find subscription by reference or subscription_code
    const subscription = await this.subscriptionRepository.findOne({
      where: [
        { reference: data.reference },
        ...(data.subscription_code
          ? [{ subscription_code: data.subscription_code }]
          : []),
      ],
      relations: ['tenant', 'plan'],
    });

    if (!subscription) {
      console.log(
        `No subscription found for invoice update: ${data.reference}`,
      );
      return;
    }

    // Update subscription fields if they exist in the invoice data
    let updated = false;

    if (
      data.subscription_code &&
      data.subscription_code !== subscription.subscription_code
    ) {
      subscription.subscription_code = data.subscription_code;
      updated = true;
    }

    if (
      data.authorization?.authorization_code &&
      data.authorization.authorization_code !== subscription.authorization_code
    ) {
      subscription.authorization_code = data.authorization.authorization_code;
      updated = true;
    }

    if (data.next_payment_date) {
      const newNextPaymentDate = new Date(data.next_payment_date);
      if (
        !subscription.next_payment_date ||
        newNextPaymentDate.getTime() !==
          subscription.next_payment_date.getTime()
      ) {
        subscription.next_payment_date = newNextPaymentDate;

        // Update current period end to be day before next payment
        subscription.current_period_end = new Date(
          newNextPaymentDate.getTime() - 24 * 60 * 60 * 1000,
        );
        updated = true;
      }
    }

    if (data.metadata) {
      subscription.metadata = data.metadata;
      updated = true;
    }

    // Check if subscription status needs updating based on invoice status
    // This is useful for cases where subscription status changes
    if (
      data.status === 'success' &&
      subscription.status !== SubscriptionStatus.ACTIVE
    ) {
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.tenant.status = TenantStatus.ACTIVE;
      await this.tenantRepository.save(subscription.tenant);
      updated = true;
    }

    if (updated) {
      await this.subscriptionRepository.save(subscription);
      console.log(
        `Subscription updated from invoice webhook: ${subscription.id}`,
      );
      console.log(
        `Next payment date: ${
          subscription.next_payment_date
            ? subscription.next_payment_date.toISOString()
            : 'null'
        }`,
      );
    } else {
      console.log(`No updates needed for subscription: ${subscription.id}`);
    }
  }

  private async handleSubscriptionDisabled(
    data: PaystackWebhookPayload['data'],
  ): Promise<void> {
    if (!data.subscription_code) {
      console.error(
        'No subscription_code found in subscription disabled webhook data',
      );
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { subscription_code: data.subscription_code },
      relations: ['tenant'],
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.CANCELLED as SubscriptionStatus;

      await this.subscriptionRepository.save(subscription);

      // Update tenant status
      subscription.tenant.status = TenantStatus.SUSPENDED;
      await this.tenantRepository.save(subscription.tenant);
    }
  }

  private async handlePaymentFailed(
    data: PaystackWebhookPayload['data'],
  ): Promise<void> {
    const subscription_code = data.subscription_code;

    if (!subscription_code) {
      console.error(
        'No subscription_code found in payment failed webhook data',
      );
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { subscription_code },
      relations: ['tenant'],
    });

    if (subscription) {
      subscription.tenant.status = TenantStatus.SUSPENDED;
      await this.tenantRepository.save(subscription.tenant);
    }
  }

  async findByTenantId(tenantId: string): Promise<Subscription | null> {
    return await this.subscriptionRepository.findOne({
      where: { tenant: { id: tenantId } },
      relations: ['plan', 'tenant'],
    });
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['tenant'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.subscription_code) {
      await this.paystackClient.cancelSubscription(
        subscription.subscription_code,
        '', // email token - you might need to store this
      );
    }

    subscription.status = SubscriptionStatus.CANCELLED as SubscriptionStatus;

    await this.subscriptionRepository.save(subscription);

    subscription.tenant.status = TenantStatus.SUSPENDED;
    await this.tenantRepository.save(subscription.tenant);
  }
}
