import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { Subscription } from '../entities/subscription.entity';
import { Plan } from '../entities/plan.entity';
import { Tenant } from '../entities/tenant.entity';
import { PaystackModule } from '../paystack/paystack.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, Plan, Tenant]),
    PaystackModule,
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
