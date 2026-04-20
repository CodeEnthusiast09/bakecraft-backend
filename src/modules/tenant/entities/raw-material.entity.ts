// src/modules/tenant/entities/raw-material.entity.ts
import { AbstractEntity } from 'src/abstract.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Recipe } from './recipe.entity';
import { ProductionShiftMaterial } from './production-shift-material.entity';

export enum MaterialUnit {
  KG = 'kg',
  G = 'g',
  LITRES = 'litres',
  ML = 'ml',
  UNITS = 'units',
  PIECES = 'pieces',
}

@Entity({ name: 'raw_materials' })
export class RawMaterial extends AbstractEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: MaterialUnit,
  })
  unit: MaterialUnit;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  reorderLevel: number;

  @OneToMany(() => Recipe, (recipe) => recipe.rawMaterial, { nullable: true })
  recipes: Recipe[];

  @OneToMany(() => ProductionShiftMaterial, (m) => m.rawMaterial, {
    nullable: true,
  })
  shiftMaterials: ProductionShiftMaterial[];
}
