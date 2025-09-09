import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Plan } from './plan.entity';
import { AbstractEntity } from 'src/abstract.entity';
import { Tenant } from './tenant.entity';
import { SubscriptionStatus } from 'src/common/enums';

@Entity('subscriptions')
export class Subscription extends AbstractEntity {
  @OneToOne(() => Tenant, (tenant) => tenant.subscription, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  tenant: Tenant;

  @ManyToOne(() => Plan, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  reference: string;

  @Column({ type: 'varchar', length: 120 })
  customer_email: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  customer_code: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  authorization_code: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  subscription_code: string | null;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.PENDING,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz', nullable: true })
  current_period_start: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  current_period_end: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  next_payment_date: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
