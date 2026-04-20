// src/modules/tenant/production/dto/update-raw-material.dto.ts
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MaterialUnit } from '../../entities/raw-material.entity';

export class UpdateRawMaterialDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(MaterialUnit)
  unit?: MaterialUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_level?: number;
}
