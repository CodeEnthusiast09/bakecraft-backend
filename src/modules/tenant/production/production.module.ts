// src/modules/tenant/production/production.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Product } from '../entities/product.entity';
import { RawMaterial } from '../entities/raw-material.entity';
import { Recipe } from '../entities/recipe.entity';
import { ProductionConfig } from '../entities/production-config.entity';
import { ProductionShift } from '../entities/production-shift.entity';
import { ProductionShiftMaterial } from '../entities/production-shift-material.entity';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      RawMaterial,
      Recipe,
      ProductionConfig,
      ProductionShift,
      ProductionShiftMaterial,
    ]),
    AuthModule,
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
