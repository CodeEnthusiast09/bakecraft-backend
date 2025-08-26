import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InitializeSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  tenantSlug: string;

  @IsNotEmpty()
  @IsString()
  plan_code: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
