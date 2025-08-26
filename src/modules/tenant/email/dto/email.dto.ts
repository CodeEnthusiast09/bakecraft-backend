import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailDto {
  @IsEmail({}, { each: true })
  recipients: string[];

  @IsNotEmpty()
  subject: string;

  @IsNotEmpty()
  @IsString()
  html: string;

  @IsString()
  text?: string;
}
