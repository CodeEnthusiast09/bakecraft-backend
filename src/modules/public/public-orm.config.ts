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

export const publicTypeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
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
      entities: ['dist/src/modules/public/entities/*.entity.js'],
      migrations: ['dist/src/modules/public/migrations/*.js'],
      synchronize: false,
    };
  },
};

export const publicConfig: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USENAME,
  password: process.env.DB_PWD,
  database: process.env.DB_NAME,
  // entities: [join(__dirname, '/../modules/public/entities/*.entity{.ts,.js}')],
  // migrations: [join(__dirname, '/../modules/public/migrations/*{.ts,.js}')],
  entities: ['dist/src/modules/public/entities/*.entity.js'],
  migrations: ['dist/src/modules/public/migrations/*.js'],
  synchronize: false,
};

const publicDatasource = new DataSource(publicConfig);

export default publicDatasource;
