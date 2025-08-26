import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('plans')
export class Plan extends AbstractEntity {
  @Index({ unique: true })
  @Column({ name: 'plan_code', type: 'varchar', length: 120 })
  plan_code: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  amount: number; // stored in kobo (Paystack format)

  @Column({ type: 'varchar', length: 20 })
  interval: 'daily' | 'weekly' | 'monthly' | 'annually';

  @Column({ type: 'varchar', length: 10, default: 'NGN' })
  currency: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 120, nullable: true })
  paystack_plan_id: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
