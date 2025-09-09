import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  recipientId?: string;

  @IsString()
  @IsNotEmpty()
  triggeredBy?: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;
}
