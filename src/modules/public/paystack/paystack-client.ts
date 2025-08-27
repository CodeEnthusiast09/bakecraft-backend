/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import type { Customer } from 'src/types/dtos';
import type {
  CustomerResponseDTO,
  PaystackCustomer,
  PaystackPaymentSessionResponse,
  PaystackPaymentSessionResult,
  PlanResponse,
  PlansListResponse,
  ResponseData,
  SubscriptionData,
  SubscriptionResponse,
} from 'src/types/paystack-api-types';

@Injectable()
export class PaystackClient {
  private readonly httpInstance: AxiosInstance;

  private readonly checkoutSuccessUrl: string;

  private readonly logger: Logger;

  public constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('paystack.url');

    const secret = this.configService.get<string>('paystack.secret_key');

    const callbackUrl = this.configService.get<string>('paystack.callback_url');

    if (!callbackUrl) {
      throw new Error('Missing paystack.callback_url in configuration');
    }

    this.checkoutSuccessUrl = callbackUrl;

    this.httpInstance = axios.create({
      baseURL,
      // timeout: 15_000,
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    this.logger = new Logger('PAYSTACK CLIENT');
  }

  async createCustomer(customerData: Customer): Promise<PaystackCustomer> {
    try {
      const { data } = await this.httpInstance.post<CustomerResponseDTO>(
        '/customer',
        {
          first_name: customerData.firstName,
          last_name: customerData.lastName,
          email: customerData.email,
          phone: customerData.phoneNumber,
        },
      );

      return data.data;
    } catch (e) {
      this.handleError(e);
      throw new InternalServerErrorException(
        'Unreachable code after handleError',
      );
    }
  }

  async findCustomerByEmail(email: string): Promise<PaystackCustomer> {
    try {
      const { data } = await this.httpInstance.get<CustomerResponseDTO>(
        `/customer/${email}`,
      );
      if (!data?.data) throw new BadRequestException('Customer not found');
      return data.data;
    } catch (e) {
      this.handleError(e);
      throw new InternalServerErrorException(
        'Unreachable code after handleError',
      );
    }
  }

  async listSubscriptions(email: string): Promise<SubscriptionData[] | null> {
    const { subscriptions } = await this.findCustomerByEmail(email);

    return subscriptions.length ? subscriptions : null;
  }

  /**
   * This method is to initialize a charge transaction. We need to pass the amount that we want the customer to be charged.
   * Various payment method is available.
   * We concatenate the planId and transactionId as the value to the reference because we will need the planId to subscribe the user to the plan when the webhook event is received.
   */
  async initializeTransaction(
    customerEmail: string,
    planCode: string,
    transactionId: string,
  ): Promise<PaystackPaymentSessionResult> {
    try {
      // const planCost = await this.getPlanCost(planId);
      const { data } =
        await this.httpInstance.post<PaystackPaymentSessionResponse>(
          '/transaction/initialize',
          {
            email: customerEmail,
            amount: planCode,
            reference: transactionId,
            callback_url: this.checkoutSuccessUrl + '?' + transactionId, // This is to add the transactionId as a query parameter to the checkoutSuccessUrl
          },
        );

      return {
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
        reference: data.data.reference,
      };
    } catch (e) {
      this.handleError(e);
      // Add a throw here to ensure all code paths return or throw
      throw new InternalServerErrorException(
        'Unreachable code after handleError',
      );
    }
  }

  /**
   * This method is to charge a customer and subscribe them to a plan.
   * Only card payment is allowed. Other payment methods can not be charged automatically
   */
  async initializeSubscription(
    customerEmail: string,
    planId: string,
    transactionId: string,
  ): Promise<PaystackPaymentSessionResult> {
    const amount = await this.getPlanCost(planId);

    const { data } =
      await this.httpInstance.post<PaystackPaymentSessionResponse>(
        '/transaction/initialize',
        {
          email: customerEmail,
          amount,
          plan: planId,
          reference: transactionId,
          channels: ['card'],
          callback_url: `${this.checkoutSuccessUrl}`,
          // callback_url: `${this.checkoutSuccessUrl}?transactionId=${transactionId}`,
        },
      );

    return {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    };
  }

  async getSubscription(id: string): Promise<SubscriptionData> {
    try {
      const { data } = await this.httpInstance.get<SubscriptionResponse>(
        `/subscription/${id}`,
      );
      return data.data;
    } catch (e) {
      this.handleError(e);
      throw new InternalServerErrorException(
        'Unreachable code after handleError',
      );
    }
  }

  // async createSubscription(customerId: string, planId: string): Promise<void> {
  //   try {
  //     await this.httpInstance.post<SubscriptionResponse>('/subscription/', {
  //       customer: customerId,
  //       plan: planId,
  //     });
  //   } catch (e) {
  //     this.handleError(e);
  //   }
  // }

  async createSubscription(
    customerCode: string,
    planId: string,
    authorizationCode: string,
  ): Promise<SubscriptionData> {
    console.log({
      customer: customerCode,
      plan: planId,
      authorization: authorizationCode,
    });

    const { data } = await this.httpInstance.post<SubscriptionResponse>(
      '/subscription',
      {
        customer: customerCode,
        plan: planId,
        authorization: authorizationCode,
      },
    );

    return data.data;
  }

  async verifyTransaction(reference: string): Promise<ResponseData> {
    const { data } = await this.httpInstance.get<{
      status: boolean;
      message: string;
      data: ResponseData;
    }>(`/transaction/verify/${reference}`);

    return data.data;
  }

  async cancelSubscription(subCode: string, emailToken: string): Promise<void> {
    try {
      await this.httpInstance.post(`/subscription/disable`, {
        code: subCode,
        token: emailToken,
      });
    } catch (e) {
      this.handleError(e);
    }
  }

  async listPlans(page = 1, perPage = 50): Promise<PlansListResponse['data']> {
    try {
      const { data } = await this.httpInstance.get<PlansListResponse>('/plan', {
        params: { page, perPage },
      });
      return data.data;
    } catch (e) {
      this.handleError(e);
      throw new InternalServerErrorException(
        'Unreachable code after handleError',
      );
    }
  }

  async getPlan(planCode: string): Promise<PlanResponse['data']> {
    try {
      const { data } = await this.httpInstance.get<PlanResponse>(
        `/plan/${planCode}`,
      );
      return data.data;
    } catch (e) {
      this.handleError(e);
      throw new InternalServerErrorException(
        'Unreachable code after handleError',
      );
    }
  }

  /**
   * This is a function to get the cost of a plan.
   * For simplicity a map can be used but we want a single source of truth.
   */
  private async getPlanCost(id: string): Promise<string> {
    try {
      const { data } = await this.httpInstance.get<PlanResponse>(`/plan/${id}`);
      return data.data.amount.toString();
    } catch (e) {
      if (axios.isAxiosError(e)) {
        this.handleError(e);
      }
      throw new InternalServerErrorException('Failed to get plan cost');
    }
  }

  private handleError(e: Error) {
    if (axios.isAxiosError(e)) {
      const response = e.message;
      this.logger.warn('Paystack API error', JSON.stringify(response));
      throw new BadRequestException(response || 'Paystack API error');
    }
    throw new InternalServerErrorException(e.message);
  }
}
