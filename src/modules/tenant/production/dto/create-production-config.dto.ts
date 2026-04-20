// src/modules/tenant/production/dto/create-production-config.dto.ts
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductionConfigDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  expected_output_quantity: number;

  @IsNotEmpty()
  @IsString()
  expected_output_unit: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  production_time_minutes: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  expected_downtime_minutes?: number;
}

export class UpdateProductionConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  expected_output_quantity?: number;

  @IsOptional()
  @IsString()
  expected_output_unit?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  production_time_minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  expected_downtime_minutes?: number;
}
