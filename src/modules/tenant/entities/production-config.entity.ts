// src/modules/tenant/entities/production-config.entity.ts
import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'production_configs' })
export class ProductionConfig extends AbstractEntity {
  @OneToOne(() => Product, (product) => product.config, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  expectedOutputQuantity: number;

  @Column()
  expectedOutputUnit: string;

  @Column({ type: 'int' })
  productionTimeMinutes: number;

  @Column({ type: 'int', default: 0 })
  expectedDowntimeMinutes: number;
}
