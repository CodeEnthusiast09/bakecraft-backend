import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanController } from './plans.controller';
import { PlanService } from './plans.service';
import { Plan } from '../entities/plan.entity';
import { PaystackModule } from '../paystack/paystack.module';

@Module({
  imports: [TypeOrmModule.forFeature([Plan]), PaystackModule],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
