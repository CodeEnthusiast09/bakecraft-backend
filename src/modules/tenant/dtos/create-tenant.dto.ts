import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateTenantDto {
  @IsNotEmpty()
  @IsString()
  company_name: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  company_email: string;

  @IsNotEmpty()
  @IsString()
  company_phone_number: string;
}
