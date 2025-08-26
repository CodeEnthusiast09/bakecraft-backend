import { Expose, Type } from 'class-transformer';
import { BaseResponseDto } from 'src/modules/tenant/dtos/responses/base-response.dto';
import { PlanResponseDto } from './plan-response.dto';
import { Subscription } from 'src/modules/public/entities/subscription.entity';

export class SubscriptionResponseDto extends BaseResponseDto {
  @Expose()
  reference: string;

  @Expose()
  status: string;

  @Expose()
  customer_email: string;

  @Expose()
  subscription_code?: string | null;

  @Expose()
  authorization_code?: string | null;

  @Expose()
  current_period_start?: Date | null;

  @Expose()
  current_period_end?: Date | null;

  @Expose()
  next_payment_date?: Date | null;

  @Expose()
  @Type(() => PlanResponseDto)
  plan: PlanResponseDto;

  @Expose()
  metadata?: Record<string, unknown> | null;

  constructor(entity: Subscription) {
    super();

    this.id = String(entity.id);

    this.created_at = entity.created_at;

    this.updated_at = entity.updated_at;

    this.reference = entity.reference;

    this.status = entity.status;

    this.customer_email = entity.customer_email;

    this.subscription_code = entity.subscription_code;

    this.authorization_code = entity.authorization_code;

    this.current_period_start = entity.current_period_start;

    this.current_period_end = entity.current_period_end;

    this.next_payment_date = entity.next_payment_date;

    this.plan = new PlanResponseDto(entity.plan);

    this.metadata = entity.metadata;
  }
}
