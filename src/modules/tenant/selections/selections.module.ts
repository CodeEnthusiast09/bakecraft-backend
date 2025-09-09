import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Department } from '../entities/department.entity';
import { SelectionsController } from './selections.controller';
import { SelectionsService } from './selections.service';
import { Role } from '../entities/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Department, Role]), AuthModule],
  controllers: [SelectionsController],
  providers: [SelectionsService],
  exports: [SelectionsService],
})
export class SelectionsModule {}
