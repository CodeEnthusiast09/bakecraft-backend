// src/modules/tenant/production/dto/create-recipe.dto.ts
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MaterialUnit } from '../../entities/raw-material.entity';

export class RecipeLineDto {
  @IsNotEmpty()
  @IsUUID()
  raw_material_id: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantity_required: number;

  @IsNotEmpty()
  @IsEnum(MaterialUnit)
  unit: MaterialUnit;
}

export class CreateRecipeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLineDto)
  lines: RecipeLineDto[];
}

export class UpdateRecipeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeLineDto)
  lines: RecipeLineDto[];
}
