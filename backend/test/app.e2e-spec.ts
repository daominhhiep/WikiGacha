import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

// Mock PrismaService BEFORE importing AppModule
jest.mock('./../src/common/prisma/prisma.service', () => ({
  PrismaService: class {
    onModuleInit = jest.fn();
    onModuleDestroy = jest.fn();
    $connect = jest.fn();
    $disconnect = jest.fn();
  },
}));

import { AppModule } from './../src/app.module';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { RedisService } from './../src/common/redis/redis.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .overrideProvider(RedisService)
      .useValue({
        on: jest.fn(),
        quit: jest.fn().mockResolvedValue('OK'),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1 (GET) - Success Response Wrapper', () => {
    return request(app.getHttpServer())
      .get('/api/v1')
      .expect(200)
      .expect({ success: true, data: 'Hello World!' });
  });

  it('/api/v1/non-existent (GET) - Error Response Wrapper', () => {
    return request(app.getHttpServer())
      .get('/api/v1/non-existent')
      .expect(404)
      .expect((res) => {
        expect(res.body.success).toBe(false);
        expect(res.body.statusCode).toBe(404);
        expect(res.body.error).toBeDefined();
        expect(res.body.path).toBe('/api/v1/non-existent');
      });
  });
});
