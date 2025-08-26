import { Module } from '@nestjs/common';
import { PaystackClient } from './paystack-client';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [PaystackClient],
  exports: [PaystackClient],
})
export class PaystackModule {}
