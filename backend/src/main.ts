import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS with very explicit settings to ensure preflight works
  app.enableCors({
    origin: '*', // For development, allow everything. Change to specific origin in production.
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api/v1');

  // Register global components
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Wikigacha API')
    .setDescription('The API documentation for Wikigacha game backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`==========================================================`);
  logger.log(`WIKIGACHA API ACTIVE ON: http://localhost:${port}/api/v1`);
  logger.log(`TEST ROUTE: http://localhost:${port}/api/v1/auth/test`);
  logger.log(`GOOGLE ROUTE: http://localhost:${port}/api/v1/auth/google`);
  logger.log(`==========================================================`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
