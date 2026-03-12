import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { WikiService } from './../src/modules/card/wiki.service';
import { RedisService } from './../src/common/redis/redis.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';

describe('Story 1: Guest User Opens Pack (e2e)', () => {
  let app: INestApplication;

  const mockWikiService = {
    getRandomArticles: jest.fn().mockResolvedValue(['A', 'B', 'C', 'D', 'E']),
    getArticleSummary: jest.fn().mockImplementation((title: string) =>
      Promise.resolve({
        title,
        extract: `Summary for ${title}`,
        thumbnail: 'https://example.com/image.jpg',
        pageid: Math.floor(Math.random() * 1000000),
        content_urls: { desktop: { page: `https://en.wikipedia.org/wiki/${title}` } },
      }),
    ),
  };

  const mockRedisService = {
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
  };

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    player: {
      create: jest
        .fn()
        .mockImplementation(({ data }) =>
          Promise.resolve({ id: 'guest-id', ...data, credits: 100 }),
        ),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.username === 'Guest_Tester' || where.id === 'guest-id') {
          return Promise.resolve({ id: 'guest-id', username: 'Guest_Tester', credits: 100 });
        }
        return Promise.resolve(null);
      }),
      update: jest
        .fn()
        .mockImplementation(({ where, data }) =>
          Promise.resolve({ id: 'guest-id', username: 'Guest_Tester', credits: 90 }),
        ),
    },
    inventory: {
      create: jest.fn().mockResolvedValue({}),
    },
    card: {
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(WikiService)
      .useValue(mockWikiService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow a guest user to login and then open a pack', async () => {
    // 1. Guest Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/guest')
      .send({ username: 'Guest_Tester' })
      .expect(201);

    expect(loginResponse.body.success).toBe(true);
    const { accessToken, player } = loginResponse.body.data;
    expect(accessToken).toBeDefined();
    expect(player.username).toBe('Guest_Tester');

    // 2. Open Pack
    const openPackResponse = await request(app.getHttpServer())
      .post('/api/v1/gacha/open')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packType: 'BASIC' })
      .expect(201);

    expect(openPackResponse.body.success).toBe(true);
    expect(openPackResponse.body.data.newCards).toHaveLength(5);
    expect(openPackResponse.body.data.remainingCredits).toBe(90);
  });
});
