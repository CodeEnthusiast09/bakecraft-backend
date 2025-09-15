import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  recipientId?: string | null;

  @IsString()
  @IsNotEmpty()
  triggeredBy?: string | null;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;
}
