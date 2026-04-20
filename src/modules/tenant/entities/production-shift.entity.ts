// src/modules/tenant/entities/production-shift.entity.ts
import { AbstractEntity } from 'src/abstract.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';
import { ProductionShiftMaterial } from './production-shift-material.entity';

export enum ShiftStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
}

@Entity({ name: 'production_shifts' })
export class ProductionShift extends AbstractEntity {
  @ManyToOne(() => Product, (product) => product.shifts, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'timestamp without time zone' })
  startedAt: Date;

  @Column({ type: 'timestamp without time zone', nullable: true })
  completedAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  actualOutputQuantity: number | null;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.IN_PROGRESS,
  })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @OneToMany(() => ProductionShiftMaterial, (m) => m.shift, { nullable: true })
  materials: ProductionShiftMaterial[];
}
