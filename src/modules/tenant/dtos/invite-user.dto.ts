import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsString()
  phone_number: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  department: string;

  @IsNotEmpty()
  @IsString()
  role: string;
}

export class InviteUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InviteUserDto)
  invites: InviteUserDto[];
}
