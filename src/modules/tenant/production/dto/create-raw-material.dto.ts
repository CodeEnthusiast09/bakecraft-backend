// src/modules/tenant/production/dto/create-raw-material.dto.ts
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MaterialUnit } from '../../entities/raw-material.entity';

export class CreateRawMaterialDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(MaterialUnit)
  unit: MaterialUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorder_level?: number;
}
