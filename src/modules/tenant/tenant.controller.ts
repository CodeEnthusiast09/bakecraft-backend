import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { TenantResponseDto } from './dtos/responses/create-tenant-response.dto';
import { successResponse, ApiResponse } from 'src/common/utils/response.helper';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<ApiResponse<TenantResponseDto>> {
    const result = await this.tenantService.createTenant(createTenantDto);

    return successResponse(
      `'${createTenantDto.company_name}' created successfully`,
      result,
    );
  }

  @Get(':slug')
  async getTenantBySlug(
    @Param('slug') slug: string,
  ): Promise<ApiResponse<TenantResponseDto>> {
    const tenant = await this.tenantService.getTenantBySlug(slug);

    return successResponse(
      `Tenant with slug '${slug}' retrieved successfully`,
      new TenantResponseDto(tenant),
    );
  }
}
