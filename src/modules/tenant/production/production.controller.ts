// src/modules/tenant/production/production.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { PayloadType } from '../auth/interface/payload-types';
import { ApiResponse, successResponse } from 'src/common/utils/response.helper';
import { ProductionService } from './production.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateRawMaterialDto } from './dto/create-raw-material.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import { CreateRecipeDto, UpdateRecipeDto } from './dto/create-recipe.dto';
import {
  CreateProductionConfigDto,
  UpdateProductionConfigDto,
} from './dto/create-production-config.dto';
import {
  AbortShiftDto,
  CompleteShiftDto,
  CreateProductionShiftDto,
} from './dto/create-production-shift.dto';

@Controller('tenants/:tenantId/production')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  // ─── Products ──────────────────────────────────────────────────────────────

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto): Promise<ApiResponse> {
    const product = await this.productionService.createProduct(dto);
    return successResponse('Product created successfully', product);
  }

  @Get('products')
  async findAllProducts(): Promise<ApiResponse> {
    const products = await this.productionService.findAllProducts();
    return successResponse('Products retrieved successfully', products);
  }

  @Get('products/:id')
  async findProductById(@Param('id') id: string): Promise<ApiResponse> {
    const product = await this.productionService.findProductById(id);
    return successResponse('Product retrieved successfully', product);
  }

  @Patch('products/:id')
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ApiResponse> {
    const product = await this.productionService.updateProduct(id, dto);
    return successResponse('Product updated successfully', product);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string): Promise<ApiResponse> {
    await this.productionService.deleteProduct(id);
    return successResponse('Product deleted successfully');
  }

  // ─── Raw Materials ─────────────────────────────────────────────────────────

  @Post('raw-materials')
  async createRawMaterial(
    @Body() dto: CreateRawMaterialDto,
  ): Promise<ApiResponse> {
    const material = await this.productionService.createRawMaterial(dto);
    return successResponse('Raw material created successfully', material);
  }

  @Get('raw-materials')
  async findAllRawMaterials(): Promise<ApiResponse> {
    const materials = await this.productionService.findAllRawMaterials();
    return successResponse('Raw materials retrieved successfully', materials);
  }

  @Get('raw-materials/:id')
  async findRawMaterialById(@Param('id') id: string): Promise<ApiResponse> {
    const material = await this.productionService.findRawMaterialById(id);
    return successResponse('Raw material retrieved successfully', material);
  }

  @Patch('raw-materials/:id')
  async updateRawMaterial(
    @Param('id') id: string,
    @Body() dto: UpdateRawMaterialDto,
  ): Promise<ApiResponse> {
    const material = await this.productionService.updateRawMaterial(id, dto);
    return successResponse('Raw material updated successfully', material);
  }

  @Delete('raw-materials/:id')
  async deleteRawMaterial(@Param('id') id: string): Promise<ApiResponse> {
    await this.productionService.deleteRawMaterial(id);
    return successResponse('Raw material deleted successfully');
  }

  // ─── Recipe ────────────────────────────────────────────────────────────────

  @Post('products/:id/recipe')
  async createRecipe(
    @Param('id') productId: string,
    @Body() dto: CreateRecipeDto,
  ): Promise<ApiResponse> {
    const recipe = await this.productionService.upsertRecipe(productId, dto);
    return successResponse('Recipe saved successfully', recipe);
  }

  @Get('products/:id/recipe')
  async findRecipe(@Param('id') productId: string): Promise<ApiResponse> {
    const recipe = await this.productionService.findRecipeByProduct(productId);
    return successResponse('Recipe retrieved successfully', recipe);
  }

  @Patch('products/:id/recipe')
  async updateRecipe(
    @Param('id') productId: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<ApiResponse> {
    const recipe = await this.productionService.upsertRecipe(productId, dto);
    return successResponse('Recipe updated successfully', recipe);
  }

  // ─── Production Config ─────────────────────────────────────────────────────

  @Post('products/:id/config')
  async createConfig(
    @Param('id') productId: string,
    @Body() dto: CreateProductionConfigDto,
  ): Promise<ApiResponse> {
    const config = await this.productionService.upsertConfig(productId, dto);
    return successResponse('Production config saved successfully', config);
  }

  @Get('products/:id/config')
  async findConfig(@Param('id') productId: string): Promise<ApiResponse> {
    const config = await this.productionService.findConfigByProduct(productId);
    return successResponse('Production config retrieved successfully', config);
  }

  @Patch('products/:id/config')
  async updateConfig(
    @Param('id') productId: string,
    @Body() dto: UpdateProductionConfigDto,
  ): Promise<ApiResponse> {
    const config = await this.productionService.upsertConfig(productId, dto);
    return successResponse('Production config updated successfully', config);
  }

  // ─── Production Shifts ─────────────────────────────────────────────────────

  @Post('shifts')
  async createShift(
    @GetUser() user: PayloadType,
    @Body() dto: CreateProductionShiftDto,
  ): Promise<ApiResponse> {
    const shift = await this.productionService.createShift(user.userId, dto);
    return successResponse('Production shift started successfully', shift);
  }

  @Get('shifts')
  async findAllShifts(): Promise<ApiResponse> {
    const shifts = await this.productionService.findAllShifts();
    return successResponse('Shifts retrieved successfully', shifts);
  }

  @Get('shifts/:id')
  async findShiftById(@Param('id') id: string): Promise<ApiResponse> {
    const shift = await this.productionService.findShiftById(id);
    return successResponse('Shift retrieved successfully', shift);
  }

  @Patch('shifts/:id/complete')
  async completeShift(
    @Param('id') id: string,
    @Body() dto: CompleteShiftDto,
  ): Promise<ApiResponse> {
    const shift = await this.productionService.completeShift(id, dto);
    return successResponse('Shift completed successfully', shift);
  }

  @Patch('shifts/:id/abort')
  async abortShift(
    @Param('id') id: string,
    @Body() dto: AbortShiftDto,
  ): Promise<ApiResponse> {
    const shift = await this.productionService.abortShift(id, dto);
    return successResponse('Shift aborted', shift);
  }

  // ─── Reports ───────────────────────────────────────────────────────────────

  @Get('reports/summary')
  async getReportSummary(): Promise<ApiResponse> {
    const summary = await this.productionService.getReportSummary();
    return successResponse('Report summary retrieved successfully', summary);
  }
}
