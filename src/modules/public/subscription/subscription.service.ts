import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Subscription } from '../../public/entities/subscription.entity';
import { Plan } from '../../public/entities/plan.entity';
import { Tenant } from '../entities/tenants.entity';
import { PaystackClient } from '../paystack/paystack-client';
import { InitializeSubscriptionDto } from './dtos/initialize-subscription.dto';
import { InitializeSubscriptionResponseDto } from './dtos/responses/init-subscription-response.dto';
import { SubscriptionStatus, TenantStatus } from '../../../common/enums';
import { v4 as uuidv4 } from 'uuid';
import {
  PaystackCustomer,
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
    const { tenantSlug, plan_code, email } = initializeSubscriptionDto;

    // Find tenant
    const tenant = await this.tenantRepository.findOne({
      where: { slug: tenantSlug },
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
      plan.paystack_plan_id || plan.plan_code,
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
      // case PaystackEvents.SUBSCRIPTION_CREATE:
      //   await this.handleSubscriptionCreated(data);
      //   break;
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

    console.log(
      `[v0] Processing successful payment for reference: ${reference}`,
    );

    const subscription = await this.subscriptionRepository.findOne({
      where: { reference },
      relations: ['tenant', 'plan'],
    });

    if (!subscription || subscription.status !== SubscriptionStatus.PENDING) {
      console.log(
        `[v0] No pending subscription found for reference: ${reference}`,
      );
      return;
    }

    // Verify transaction
    let transaction: ResponseData;
    try {
      transaction = await this.paystackClient.verifyTransaction(reference);
      console.log(`[v0] Transaction verified successfully`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Failed to verify transaction: ${err.message}`);
      } else {
        console.error('Failed to verify transaction', err);
      }
      return;
    }

    const authorizationCode = transaction.authorization?.authorization_code;
    if (!authorizationCode) {
      console.error('No authorization_code in transaction verification');
      return;
    }

    // Create subscription in Paystack
    let paystackSubscription: SubscriptionData;
    try {
      paystackSubscription = await this.paystackClient.createSubscription(
        subscription.customer_code,
        subscription.plan.paystack_plan_id || subscription.plan.plan_code,
        authorizationCode,
      );
      console.log(
        `[v0] Paystack subscription created: ${paystackSubscription.subscription_code}`,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Failed to create Paystack subscription: ${err.message}`);
      } else {
        console.error('Failed to create Paystack subscription', err);
      }
      return;
    }

    // Update DB subscription
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.subscription_code = paystackSubscription.subscription_code;
    subscription.authorization_code = authorizationCode;
    subscription.current_period_start = new Date(
      paystackSubscription.created_at,
    );
    subscription.next_payment_date = new Date(
      paystackSubscription.next_payment_date,
    );

    await this.subscriptionRepository.save(subscription);

    // Update tenant status
    subscription.tenant.status = TenantStatus.ACTIVE;
    await this.tenantRepository.save(subscription.tenant);
  }

  private async handleSubscriptionCreated(
    data: PaystackWebhookPayload['data'],
  ): Promise<void> {
    if (!data.reference) {
      console.error('No reference found in subscription created webhook data');
      return;
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { reference: data.reference },
      relations: ['tenant'],
    });

    if (subscription) {
      subscription.status = SubscriptionStatus.ACTIVE;
      if (data.subscription_code) {
        subscription.subscription_code = data.subscription_code;
      }
      if (data.authorization?.authorization_code) {
        subscription.authorization_code = data.authorization.authorization_code;
      }
      if (data.created_at) {
        subscription.current_period_start = new Date(data.created_at);
      }
      if (data.next_payment_date) {
        subscription.next_payment_date = new Date(data.next_payment_date);
      }

      await this.subscriptionRepository.save(subscription);

      // Update tenant status
      subscription.tenant.status = TenantStatus.ACTIVE;
      await this.tenantRepository.save(subscription.tenant);

      console.log(
        `[v0] Subscription activated for tenant: ${subscription.tenant.slug}`,
      );
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
