import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { InitializeSubscriptionDto } from './dtos/initialize-subscription.dto';
import { InitializeSubscriptionResponseDto } from './dtos/responses/init-subscription-response.dto';
import { SubscriptionResponseDto } from './dtos/responses/subscription-response.dto';
import { PaystackWebhookPayload } from 'src/types/paystack-api-types';
import { WebhookGuard } from 'src/common/guards/webhook.guard';
import { Public } from 'src/common/decorators/public.decorator';

@Controller('subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Post('initialize')
  async initializeSubscription(
    @Body() initializeSubscriptionDto: InitializeSubscriptionDto,
  ): Promise<InitializeSubscriptionResponseDto> {
    return await this.subscriptionService.initializeSubscription(
      initializeSubscriptionDto,
    );
  }

  @Get('tenant/:tenantId')
  async getSubscriptionByTenant(
    @Param('tenantId') tenantId: string,
  ): Promise<SubscriptionResponseDto | null> {
    const subscription =
      await this.subscriptionService.findByTenantId(tenantId);
    return subscription ? new SubscriptionResponseDto(subscription) : null;
  }

  @Delete(':id')
  async cancelSubscription(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    await this.subscriptionService.cancelSubscription(id);
    return { message: 'Subscription cancelled successfully' };
  }

  @Post('webhook')
  @Public()
  @UseGuards(WebhookGuard)
  async handleWebhook(
    @Body() payload: PaystackWebhookPayload,
  ): Promise<{ status: string }> {
    await this.subscriptionService.handleWebhook(payload);
    return { status: 'success' };
  }
}
