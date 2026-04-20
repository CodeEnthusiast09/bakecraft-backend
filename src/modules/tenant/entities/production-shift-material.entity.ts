// src/modules/tenant/entities/production-shift-material.entity.ts
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductionShift } from './production-shift.entity';
import { RawMaterial } from './raw-material.entity';

@Entity({ name: 'production_shift_materials' })
export class ProductionShiftMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductionShift, (shift) => shift.materials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shift_id' })
  shift: ProductionShift;

  @ManyToOne(() => RawMaterial, (material) => material.shiftMaterials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'raw_material_id' })
  rawMaterial: RawMaterial;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantityUsed: number;
}
