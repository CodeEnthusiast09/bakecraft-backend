import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailDto } from './dto/email.dto';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}
  emailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return transporter;
  }

  async sendEmail(dto: EmailDto) {
    const transporter = this.emailTransport();

    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: dto.recipients,
      subject: dto.subject,
      text: dto.text,
      html: dto.html,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Email sent successfully' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to send email: ${error.message}`);
      }
      throw new Error(`Failed to send email: ${String(error)}`);
    }
  }

  async sendActivationEmail(email: string, token: string) {
    const activationUrl = `${this.configService.get<string>('FRONT_END_URL')}/activate?token=${token}`;

    // Using nodemailer example
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Activate Your Account',
      html: `
        <h2>Welcome!</h2>
        <p>Click the link below to activate your account:</p>
        <a href="${activationUrl}">Activate Account</a>
        <p>This link expires in 24 hours.</p>
      `,
    };

    const transporter = this.emailTransport();
    await transporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(
    email: string,
    first_name: string,
    tenantSlug: string,
  ) {
    const mailOptions: nodemailer.SendMailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Welcome to Bakecraft 🎉',
      html: `
    <h2>Hello ${first_name},</h2>
    <p>Welcome to <strong>Bakecraft</strong>! We're thrilled to have you on board.</p>

    <p>You can now explore our platform, set up your shop, and start baking with success 🚀</p>

    <p>
      To log in anytime, simply visit your bakery's login page:<br/>
      <a href="https://bakecraft.com/${tenantSlug}/login" target="_blank">
        https://bakecraft.com/${tenantSlug}/login
      </a>
    </p>

    <p><strong>Your login email:</strong> ${email}</p>

    <p>If you ever need help, feel free to contact our support team.</p>

    <br/>
    <p>Cheers,</p>
    <p>The Bakecraft Team</p>
  `,
    };

    const transporter = this.emailTransport();

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Welcome email sent successfully' };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to send welcome email: ${error.message}`);
      }
      throw new Error(`Failed to send welcome email: ${String(error)}`);
    }
  }
}
