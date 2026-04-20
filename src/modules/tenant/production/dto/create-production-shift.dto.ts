// src/modules/tenant/production/dto/create-production-shift.dto.ts
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShiftMaterialDto {
  @IsNotEmpty()
  @IsUUID()
  raw_material_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity_used: number;
}

export class CreateProductionShiftDto {
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @IsNotEmpty()
  @IsDateString()
  started_at: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftMaterialDto)
  materials?: ShiftMaterialDto[];
}

export class CompleteShiftDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  actual_output_quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftMaterialDto)
  materials?: ShiftMaterialDto[];
}

export class AbortShiftDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
