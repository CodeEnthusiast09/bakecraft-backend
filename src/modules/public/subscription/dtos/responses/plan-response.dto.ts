import { Expose } from 'class-transformer';
import { BaseResponseDto } from 'src/modules/tenant/dtos/responses/base-response.dto';
import { Plan } from 'src/modules/public/entities/plan.entity';

export class PlanResponseDto extends BaseResponseDto {
  @Expose()
  planCode: string;

  @Expose()
  name: string;

  @Expose()
  amount: number;

  @Expose()
  interval: string;

  @Expose()
  currency: string;

  @Expose()
  active: boolean;

  @Expose()
  description?: string | null;

  constructor(p: Plan) {
    super();

    this.id = p.id;

    this.planCode = p.plan_code;

    this.created_at = p.created_at;

    this.updated_at = p.updated_at;

    this.name = p.name;

    this.amount = p.amount;

    this.interval = p.interval;

    this.currency = p.currency;

    this.active = p.active;

    this.description = p.description;
  }
}
