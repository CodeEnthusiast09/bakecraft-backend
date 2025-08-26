import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Request } from 'express';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const http = context.switchToHttp();

    const request = http.getRequest<Request>();

    const secret = this.config.get<string>('paystack.secret_key');

    if (!secret) {
      throw new UnauthorizedException('Paystack secret key not configured');
    }

    const signature = request.headers['x-paystack-signature'] as string;

    if (!signature) {
      throw new UnauthorizedException('No signature provided');
    }

    // const rawBody = Buffer.isBuffer(request.body)
    //   ? request.body
    //   : Buffer.from(request.body || '');

    const rawBody = Buffer.isBuffer(request.body)
      ? request.body
      : Buffer.from(JSON.stringify(request.body) || '');

    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');

    console.log('🔹 Computed Hash:', hash);
    console.log('🔹 Raw Body (string):', rawBody.toString());

    const signatureBuffer = Buffer.from(signature);

    const hashBuffer = Buffer.from(hash);

    try {
      const isValid =
        signatureBuffer.length === hashBuffer.length &&
        crypto.timingSafeEqual(signatureBuffer, hashBuffer);

      if (!isValid) {
        throw new UnauthorizedException('Invalid signature');
      }

      return true;
    } catch {
      throw new UnauthorizedException('Invalid signature');
    }
  }
}
