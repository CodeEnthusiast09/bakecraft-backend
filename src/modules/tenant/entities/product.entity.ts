// src/modules/tenant/entities/product.entity.ts
import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { Recipe } from './recipe.entity';
import { ProductionConfig } from './production-config.entity';
import { ProductionShift } from './production-shift.entity';

@Entity({ name: 'products' })
export class Product extends AbstractEntity {
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Recipe, (recipe) => recipe.product, { nullable: true })
  recipes: Recipe[];

  @OneToOne(() => ProductionConfig, (config) => config.product, {
    nullable: true,
  })
  config: ProductionConfig | null;

  @OneToMany(() => ProductionShift, (shift) => shift.product, { nullable: true })
  shifts: ProductionShift[];
}
