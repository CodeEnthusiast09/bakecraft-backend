/* eslint-disable @typescript-eslint/require-await */
import { DataSource, DataSourceOptions } from 'typeorm';
import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
// import { join } from 'path';

dotenvConfig({ path: '.env.local' });

export const tenantTypeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (
    configService: ConfigService,
  ): Promise<TypeOrmModuleOptions> => {
    return {
      type: 'postgres',
      host: configService.get<string>('database.host'),
      port: configService.get<number>('database.port'),
      username: configService.get<string>('database.user'),
      database: configService.get<string>('database.name'),
      password: configService.get<string>('database.pass'),
      entities: ['dist/src/modules/tenant/entities/*.entity.js'],
      migrations: ['dist/src/modules/tenant/migrations/*.js'],
      synchronize: false,
    };
  },
};

export const tenantConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USENAME,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  // entities: [join(__dirname, '/../modules/tenant/entities/*.entity{.ts,.js}')],
  // migrations: [join(__dirname, '/../modules/tenant/migrations/*{.ts,.js}')],
  entities: ['dist/src/modules/tenant/entities/*.entity.js'],
  migrations: ['dist/src/modules/tenant/migrations/*.js'],
  synchronize: false,
};

const tenantDatasource = new DataSource(tenantConfig);

export default tenantDatasource;
