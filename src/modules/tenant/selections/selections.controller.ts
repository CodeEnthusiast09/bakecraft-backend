import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PayloadType } from '../auth/interface/payload-types';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
import { SelectionsService } from './selections.service';
import { SelectionResponseDto } from '../dtos/responses/selection-response.dto';

@Controller('tenants/:tenantId/selections')
@UseGuards(JwtAuthGuard)
export class SelectionsController {
  constructor(private readonly selectionsService: SelectionsService) {}

  @Get('departments')
  async getDepartmentForSelect(): Promise<ApiResponse<SelectionResponseDto[]>> {
    const departments =
      await this.selectionsService.getDepartmentsForSelection();

    return successResponse('Departments retrieved successfully', departments);
  }

  @Get('roles')
  async getRolesForSelect(): Promise<ApiResponse<SelectionResponseDto[]>> {
    const roles = await this.selectionsService.getRolesForSelection();

    return successResponse('Roles retrieved successfully', roles);
  }
}
