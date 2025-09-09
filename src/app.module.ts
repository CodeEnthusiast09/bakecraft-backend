/* eslint-disable @typescript-eslint/require-await */

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TenantModule } from './modules/tenant/tenant.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { publicTypeOrmAsyncConfig } from './modules/public/public-orm.config';
import { validate } from 'env.validation';
import { TenantController } from './modules/tenant/tenant.controller';
import { TenantService } from './modules/tenant/tenant.service';
import { TenancyModule } from './modules/tenancy/tenancy.module';
import configuration from './config/configuration';
import { TenancyMiddleware } from './modules/tenancy/tenancy.middleware';
import { UsersModule } from './modules/tenant/users/users.module';
import { AuthModule } from './modules/tenant/auth/auth.module';
import { EmailModule } from './modules/tenant/email/email.module';
import { APP_GUARD } from '@nestjs/core';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { PlanModule } from './modules/public/plans/plans.module';
import { SubscriptionModule } from './modules/public/subscription/subscription.module';
import { PaystackModule } from './modules/public/paystack/paystack.module';
import { NotificationsModule } from './modules/tenant/notifications/notifications.module';
import { DepartmentModule } from './modules/tenant/departments/departments.module';
import { RolesModule } from './modules/tenant/roles/roles.module';
import { SelectionsModule } from './modules/tenant/selections/selections.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [configuration],
      validate: validate,
    }),
    TypeOrmModule.forRootAsync(publicTypeOrmAsyncConfig),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get<string>('email.host'),
          port: config.get<number>('email.port'),
          secure: config.get<string>('email.secure') === 'true',
          auth: {
            user: config.get<string>('email.user'),
            pass: config.get<string>('email.pass'),
          },

          pool: config.get<string>('email.pool') === 'true',

          maxConnections: Number(config.get('email.max_conn') || 5),

          maxMessages: Number(config.get('email.msg') || 100),

          tls: {
            rejectUnauthorized: config.get<string>('NODE_ENV') === 'production',
          },
        },
        defaults: {
          from:
            config.get<string>('email.from') ||
            `"Bakecraft" <${config.get<string>('email.user')}>`,
        },
        template: {
          dir: path.join(process.cwd(), 'dist/modules/tenant/email/templates'),
          adapter: new HandlebarsAdapter(
            {
              capitalize: (str: string) =>
                str ? str.charAt(0).toUpperCase() + str.slice(1) : '',
            },
            {
              inlineCssEnabled: true,
            },
          ),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    TenantModule,
    TenantModule,
    TenancyModule,
    UsersModule,
    AuthModule,
    EmailModule,
    PlanModule,
    SubscriptionModule,
    PaystackModule,
    NotificationsModule,
    RolesModule,
    DepartmentModule,
    SelectionsModule,
  ],
  controllers: [TenantController],
  providers: [
    TenantService,
    {
      provide: APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenancyMiddleware).forRoutes('*');
  }
}
