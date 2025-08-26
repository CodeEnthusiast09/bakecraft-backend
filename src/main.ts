import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/utils/exception-filter';
import { ConfigService } from '@nestjs/config';
// import * as bodyParser from 'body-parser';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());

    app.useGlobalFilters(new AllExceptionsFilter());

    // app.use(
    //   '/subscriptions/webhook',
    //   bodyParser.raw({ type: 'application/json' }),
    // );

    const configService = app.get(ConfigService);

    const port = configService.get<number>('port', 3000);

    await app.listen(port);

    logger.log(`Application is running on port: ${port} `);
  } catch (error) {
    logger.error('Error starting the application', error);

    process.exit(1);
  }
}

// Fix the floating promise by adding .catch()
bootstrap().catch((error) => {
  console.error('Unhandled error in bootstrap:', error);

  process.exit(1);
});
