import { Entity, Column, OneToOne } from 'typeorm';
import { AbstractEntity } from 'src/abstract.entity';
import { Subscription } from './subscription.entity';
import { TenantStatus } from 'src/common/enums';

@Entity({ name: 'tenants' })
export class Tenant extends AbstractEntity {
  @Column({ unique: true })
  company_name: string;

  @Column()
  company_email: string;

  @Column()
  company_phone_number: string;

  @Column()
  slug: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  status: TenantStatus;

  @OneToOne(() => Subscription, (subscription) => subscription.tenant)
  subscription: Subscription;
}
