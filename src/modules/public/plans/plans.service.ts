import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Plan } from '../../public/entities/plan.entity';
import { PaystackClient } from '../paystack/paystack-client';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PlanService {
  private readonly logger = new Logger(PlanService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    private readonly paystackClient: PaystackClient,
  ) {}

  async findAll(): Promise<Plan[]> {
    return await this.planRepository.find({
      where: { active: true },
      order: { amount: 'ASC' },
    });
  }

  async findByCode(plan_code: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { plan_code, active: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async findById(id: string): Promise<Plan> {
    const plan = await this.planRepository.findOne({
      where: { id, active: true },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async syncPlansFromPaystack(): Promise<{
    synced: number;
    updated: number;
    created: number;
  }> {
    this.logger.log('Starting plan synchronization from Paystack...');

    try {
      const paystackPlans = await this.paystackClient.listPlans();
      let created = 0;
      let updated = 0;

      for (const paystackPlan of paystackPlans) {
        const existingPlan = await this.planRepository.findOne({
          where: { plan_code: paystackPlan.plan_code },
        });

        if (existingPlan) {
          // Update existing plan
          existingPlan.name = paystackPlan.name;
          existingPlan.amount = paystackPlan.amount;
          existingPlan.interval = String(
            paystackPlan.interval,
          ) as typeof existingPlan.interval;
          existingPlan.currency = paystackPlan.currency;
          existingPlan.description = paystackPlan.description || null;
          existingPlan.active = paystackPlan.active ?? true;
          existingPlan.paystack_plan_id = paystackPlan.id.toString();

          await this.planRepository.save(existingPlan);
          updated++;
          this.logger.log(`Updated plan: ${paystackPlan.plan_code}`);
        } else {
          // Create new plan
          const newPlan = this.planRepository.create({
            plan_code: paystackPlan.plan_code,
            name: paystackPlan.name,
            amount: paystackPlan.amount,
            interval: String(paystackPlan.interval) as Plan['interval'],
            currency: paystackPlan.currency,
            description: paystackPlan.description || null,
            active: paystackPlan.active ?? true,
            paystack_plan_id: paystackPlan.id.toString(),
          });

          await this.planRepository.save(newPlan);
          created++;
          this.logger.log(`Created plan: ${paystackPlan.plan_code}`);
        }
      }

      this.logger.log(
        `Plan sync completed. Created: ${created}, Updated: ${updated}`,
      );
      return { synced: paystackPlans.length, created, updated };
    } catch (error) {
      this.logger.error('Failed to sync plans from Paystack', error);
      throw error;
    }
  }

  async syncSinglePlanFromPaystack(planCode: string): Promise<Plan> {
    this.logger.log(`Syncing single plan: ${planCode}`);

    try {
      const paystackPlan = await this.paystackClient.getPlan(planCode);

      let plan = await this.planRepository.findOne({
        where: { plan_code: paystackPlan.plan_code },
      });

      if (plan) {
        // Update existing plan
        plan.name = paystackPlan.name;
        plan.amount = paystackPlan.amount;
        plan.interval = paystackPlan.interval as Plan['interval'];
        plan.currency = paystackPlan.currency;
        plan.description = paystackPlan.description || null;
        plan.active = plan.active ?? true;
        plan.paystack_plan_id = paystackPlan.id.toString();
      } else {
        // Create new plan
        plan = this.planRepository.create({
          plan_code: paystackPlan.plan_code,
          name: paystackPlan.name,
          amount: paystackPlan.amount,
          interval: paystackPlan.interval as Plan['interval'],
          currency: paystackPlan.currency,
          description: paystackPlan.description || null,
          active: true,
          paystack_plan_id: paystackPlan.id.toString(),
        });
      }

      const savedPlan = await this.planRepository.save(plan);
      this.logger.log(`Successfully synced plan: ${planCode}`);
      return savedPlan;
    } catch (error) {
      this.logger.error(`Failed to sync plan: ${planCode}`, error);
      throw error;
    }
  }
}
