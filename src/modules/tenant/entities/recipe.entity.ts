// src/modules/tenant/entities/recipe.entity.ts
import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { RawMaterial, MaterialUnit } from './raw-material.entity';

@Entity({ name: 'recipes' })
export class Recipe extends AbstractEntity {
  @ManyToOne(() => Product, (product) => product.recipes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => RawMaterial, (material) => material.recipes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'raw_material_id' })
  rawMaterial: RawMaterial;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  quantityRequired: number;

  @Column({
    type: 'enum',
    enum: MaterialUnit,
  })
  unit: MaterialUnit;
}
