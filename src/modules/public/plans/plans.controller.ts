import { Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { PlanService } from './plans.service';
import { PlanResponseDto } from '../subscription/dtos/responses/plan-response.dto';

@Controller('plans')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async getAllPlans(): Promise<PlanResponseDto[]> {
    const plans = await this.planService.findAll();
    return plans.map((plan) => new PlanResponseDto(plan));
  }

  @Get(':code')
  async getPlanByCode(code: string): Promise<PlanResponseDto> {
    const plan = await this.planService.findByCode(code);
    return new PlanResponseDto(plan);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncPlans(): Promise<{
    message: string;
    synced: number;
    created: number;
    updated: number;
  }> {
    const result = await this.planService.syncPlansFromPaystack();
    return {
      message: 'Plans synchronized successfully',
      ...result,
    };
  }

  @Post('sync/:code')
  @HttpCode(HttpStatus.OK)
  async syncSinglePlan(
    code: string,
  ): Promise<{ message: string; plan: PlanResponseDto }> {
    const plan = await this.planService.syncSinglePlanFromPaystack(code);
    return {
      message: 'Plan synchronized successfully',
      plan: new PlanResponseDto(plan),
    };
  }
}
