import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivateAccountDto {
  @IsNotEmpty()
  @IsString()
  user_id: string;

  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  password: string;

  @IsNotEmpty()
  @MinLength(6)
  @IsString()
  password_confirmation: string;
}
