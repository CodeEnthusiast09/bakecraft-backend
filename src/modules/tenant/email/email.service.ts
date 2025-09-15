import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import { EmailDto } from './dto/email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  private async sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  /**
   * Small exponential-backoff retry wrapper for transient SMTP failures.
   * Adjust retries or move to job/queue for larger volume.
   */
  private async sendMailWithRetry(
    mailOptions: Parameters<MailerService['sendMail']>[0],
    retries = 3,
  ) {
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        await this.mailerService.sendMail(mailOptions);
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `sendMail attempt ${attempt + 1} failed: ${(err as Error)?.message || err}`,
        );
        // If last attempt, break and throw after loop
        if (attempt < retries - 1) {
          await this.sleep(1000 * Math.pow(2, attempt)); // 1s, 2s, 4s
        }
      }
    }
    this.logger.error('All email retries failed', lastError as Error);
    throw lastError;
  }

  async sendGenericEmail(dto: EmailDto) {
    const mailOptions = {
      to: dto.recipients,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
      from: this.configService.get<string>('email.from'),
    };
    return this.sendMailWithRetry(mailOptions);
  }

  /**
   * Activation email: uses template `activation.hbs` in templates dir.
   * The adapter (configured in app.module) will render the template and layout.
   */
  async sendActivationEmail(
    id: string,
    firstName: string,
    recipientEmail: string,
    tenantSlug: string,
    token: string,
  ) {
    const frontEndUrl =
      this.configService.get<string>('frontendUrl') || 'https://bakecraft.com';

    const activationUrl = `${frontEndUrl}/${tenantSlug}/activate-account?key=${encodeURIComponent(token)}&staff=${encodeURIComponent(id)}`;

    const mailOptions = {
      to: recipientEmail,
      subject: 'Activate Your Bakecraft Account',
      template: 'activation', // activation.hbs
      context: {
        firstName,
        activationUrl,
        year: new Date().getFullYear(),
      },
      attachments: [
        {
          filename: 'logo-white.png',
          path: path.join(
            process.cwd(),
            'src/modules/tenant/email/templates/assets/logo-white.png',
          ),
          cid: 'logo', // referenced in template as <img src="cid:logo"/>
        },
      ],
    };

    return this.sendMailWithRetry(mailOptions);
  }

  async sendWelcomeEmail(
    recipientEmail: string,
    firstName: string,
    tenantSlug: string,
  ) {
    const frontEndUrl =
      this.configService.get<string>('frontendUrl') || 'https://bakecraft.com';
    const loginUrl = `${frontEndUrl}/${tenantSlug}/login`;

    const mailOptions = {
      to: recipientEmail,
      subject: 'Welcome to Bakecraft 🎉',
      template: 'welcome', // welcome.hbs
      context: {
        firstName,
        loginUrl,
        email: recipientEmail,
        year: new Date().getFullYear(),
      },
      attachments: [
        {
          filename: 'logo-white.png',
          path: path.join(
            process.cwd(),
            'src/modules/tenant/email/templates/assets/logo-white.png',
          ),
          cid: 'logo',
        },
      ],
    };

    return this.sendMailWithRetry(mailOptions);
  }

  // Optional: close transporter pools on shutdown
  // MailerService wraps Nodemailer; some versions expose a transporter instance.
  // We try to close it gracefully if available (nodemailer transporter.close()).
  //   onModuleDestroy() {
  //     try {
  //       const mailerAny = this.mailerService as any;
  //       const transport = mailerAny?.transporter ?? mailerAny?.transporter; // tolerate naming
  //       if (transport && typeof transport.close === 'function') {
  //         transport.close();
  //         this.logger.log('Mailer transporter pool closed.');
  //       }
  //     } catch (err) {
  //       this.logger.warn(
  //         'Could not close mailer transporter automatically.',
  //         err as Error,
  //       );
  //     }
  //   }
}
