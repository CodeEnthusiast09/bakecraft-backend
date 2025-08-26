import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailDto } from './dto/email.dto';

@Controller('tenants/:tenantId/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('send-email')
  async sendEmail(@Body() dto: EmailDto) {
    await this.emailService.sendEmail(dto);
    return { message: 'Email sent successfully' };
  }
}
