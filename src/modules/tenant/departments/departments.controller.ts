import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PayloadType } from '../auth/interface/payload-types';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
import { DepartmentsService } from './departments.service';
import { DepartmentResponseDto } from '../dtos/responses/department-response.dto';
import { CreateDepartmentDto } from '../dtos/create-department.dto';

@Controller('tenants/:tenantId/departments')
@UseGuards(JwtAuthGuard)
export class DepartmentController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  async createDepartment(
    @GetUser() user: PayloadType,
    @Body() dto: CreateDepartmentDto,
  ): Promise<ApiResponse<DepartmentResponseDto>> {
    const role = await this.departmentsService.create(user.userId, dto);

    return successResponse(
      'Department created successfully',
      new DepartmentResponseDto(role),
    );
  }

  @Get('selections')
  async getDepartmentForSelect() {
    const departments = await this.departmentsService.findAll();
    return departments.map((department) => ({
      value: department.id,
      label: department.name,
    }));
  }
}
