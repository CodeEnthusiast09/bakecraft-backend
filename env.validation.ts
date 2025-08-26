import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  validateSync,
  // ValidationError,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Provision = 'provision',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsNumber()
  PORT: number;

  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_HOST: string;

  @IsString()
  DB_USENAME: string;

  @IsString()
  DB_PWD: string;

  @IsString()
  DB_NAME: string;

  @IsString()
  EMAIL_HOST: string;

  @IsNumber()
  EMAIL_PORT: number;

  @IsString()
  EMAIL_USER: string;

  @IsString()
  EMAIL_PASS: string;

  @IsString()
  FRONT_END_URL: string;

  @IsString()
  SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  // console.log('config: ', config);

  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  // console.log(validatedConfig);

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  // if (errors.length > 0) {
  //   const errorMessages = errors
  //     .map((err: ValidationError) => {
  //       const constraints = err.constraints
  //         ? Object.values(err.constraints).join(', ')
  //         : 'Unknown error';
  //       return `${err.property}: ${constraints}`;
  //     })
  //     .join(' | ');
  //   throw new Error(`Environment validation error(s): ${errorMessages}`);
  // }
  return validatedConfig;
}
