// src/modules/tenant/production/dto/create-product.dto.ts
import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
