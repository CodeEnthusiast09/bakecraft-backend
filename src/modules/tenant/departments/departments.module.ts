import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Department } from '../entities/department.entity';
import { DepartmentController } from './departments.controller';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Department]), AuthModule],
  controllers: [DepartmentController],
  providers: [DepartmentsService],
  exports: [DepartmentsService],
})
export class DepartmentModule {}
