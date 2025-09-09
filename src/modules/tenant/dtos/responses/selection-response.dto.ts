export class SelectionResponseDto {
  id: string;
  name: string;
}

// import { Inject, Injectable } from '@nestjs/common';
// import { DataSource, Repository } from 'typeorm';
// import { CONNECTION } from 'src/modules/tenancy/tenancy.symbol';
// import { Department } from '../entities/department.entity';
// import { Role } from '../entities/role.entity';

// @Injectable()
// export class SelectionsService {
//   private readonly departmentsRepo: Repository<Department>;
//   private readonly rolesRepo: Repository<Role>;

//   constructor(
//     @Inject(CONNECTION)
//     private readonly connection: DataSource,
//   ) {
//     this.departmentsRepo = this.connection.getRepository(Department);
//     this.rolesRepo = this.connection.getRepository(Role);
//   }

//   async getDepartmentsForSelection(): Promise<Department[]> {
//     return this.departmentsRepo.find({
//       order: { name: 'ASC' },
//       select: ['id', 'name'],
//     });
//   }

//   async getRolesForSelection(): Promise<Role[]> {
//     return this.rolesRepo.find({
//       order: { name: 'ASC' },
//       select: ['id', 'name'],
//     });
//   }
// }

// import { Controller, Get, UseGuards } from '@nestjs/common';
// import { JwtAuthGuard } from '../auth/guards/jwt.guard';
// import { GetUser } from '../auth/decorators/get-user.decorator';
// import { PayloadType } from '../auth/interface/payload-types';
// import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
// import { SelectionsService } from './selections.service';
// import { SelectionResponseDto } from '../dtos/responses/selection-response.dto';

// @Controller('tenants/:tenantId/selections')
// @UseGuards(JwtAuthGuard)
// export class SelectionsController {
//   constructor(private readonly selectionsService: SelectionsService) {}

//   @Get('departments')
//   async getDepartmentForSelect(): Promise<ApiResponse<SelectionResponseDto[]>> {
//     const departments =
//       await this.selectionsService.getDepartmentsForSelection();
//     const results = departments.map((department) => ({
//       value: department.id,
//       label: department.name,
//     }));

//     return successResponse('Departments retrieved successfully', results);
//   }

//   @Get('roles')
//   async getRolesForSelect(): Promise<ApiResponse<SelectionResponseDto[]>> {
//     const roles = await this.selectionsService.getRolesForSelection();
//     const results = roles.map((role) => ({
//       value: role.id,
//       label: role.name,
//     }));

//     return successResponse('Roles retrieved successfully', results);
//   }
// }

// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { AuthModule } from '../auth/auth.module';
// import { Department } from '../entities/department.entity';
// import { SelectionsController } from './selections.controller';
// import { SelectionsService } from './selections.service';
// import { Role } from '../entities/role.entity';

// @Module({
//   imports: [TypeOrmModule.forFeature([Department, Role]), AuthModule],
//   controllers: [SelectionsController],
//   providers: [SelectionsService],
//   exports: [SelectionsService],
// })
// export class SelectionsModule {}

// export class SelectionResponseDto {
//   value: string;
//   label: string;
// }

// for the roles, I want to send every role but bakery manager. and also the data
