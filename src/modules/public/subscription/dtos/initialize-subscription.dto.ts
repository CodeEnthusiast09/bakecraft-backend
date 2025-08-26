import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InitializeSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  tenant_slug: string;

  @IsNotEmpty()
  @IsString()
  plan_code: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
