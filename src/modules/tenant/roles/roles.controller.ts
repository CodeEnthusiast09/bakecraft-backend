import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { RolesService } from './roles.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PayloadType } from '../auth/interface/payload-types';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
import { RoleResponseDto } from '../dtos/responses/role-response.dto';

@Controller('tenants/:tenantId/roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  async createRoles(
    @GetUser() user: PayloadType,
    @Body() dto: CreateRoleDto,
  ): Promise<ApiResponse<RoleResponseDto>> {
    const role = await this.rolesService.create(user.userId, dto);

    return successResponse(
      'Role created successfully',
      new RoleResponseDto(role),
    );
  }

  @Get('selections')
  async getRolesForSelect() {
    const roles = await this.rolesService.findAll();
    return roles.map((role) => ({
      value: role.id,
      label: role.name,
    }));
  }
}
