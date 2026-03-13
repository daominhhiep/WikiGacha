import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';

// Mock PrismaService BEFORE importing AppModule
jest.mock('./../src/common/prisma/prisma.service', () => ({
  PrismaService: class {
    onModuleInit = jest.fn();
    onModuleDestroy = jest.fn();
    player = {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    inventory = {
      count: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    };
    card = {
      upsert: jest.fn(),
    };
  },
}));

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { WikiService } from './../src/modules/card/wiki.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { RedisService } from './../src/common/redis/redis.service';

describe('GachaController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accessToken: string;
  const playerId = 'test-player-id';

  const mockWikiService = {
    getRandomArticles: jest
      .fn()
      .mockResolvedValue(['Article 1', 'Article 2', 'Article 3', 'Article 4', 'Article 5']),
    getArticleSummary: jest.fn().mockImplementation((title: string) =>
      Promise.resolve({
        title,
        extract: `Summary for ${title}`,
        thumbnail: 'https://example.com/image.jpg',
        pageid: Math.floor(Math.random() * 1000000),
        content_urls: { desktop: { page: `https://en.wikipedia.org/wiki/${title}` } },
      }),
    ),
    getArticleStats: jest.fn().mockResolvedValue({
      pageViews: 1000,
      languageCount: 5,
    }),
    getGlobalStats: jest.fn().mockResolvedValue({
      articleCount: 7000000,
      totalMonthlyViews: 10500000000,
    }),
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
      upsert: jest.fn().mockResolvedValue({ id: playerId, username: 'testplayer', credits: 100 }),
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: playerId, username: 'testplayer', credits: 100 }),
      update: jest.fn().mockResolvedValue({ id: playerId, username: 'testplayer', credits: 90 }),
      delete: jest.fn().mockResolvedValue({}),
    },
    inventory: {
      count: jest.fn().mockResolvedValue(5),
      deleteMany: jest.fn().mockResolvedValue({}),
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

    jwtService = app.get<JwtService>(JwtService);
    accessToken = jwtService.sign({ sub: playerId, username: 'testplayer' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/gacha/open', () => {
    it('should open a pack and return 5 new cards', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/gacha/open')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ packType: 'BASIC' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.newCards).toHaveLength(5);
      expect(response.body.data.remainingCredits).toBe(90);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/gacha/open')
        .send({ packType: 'BASIC' })
        .expect(401);
    });

    it('should return 400 if player has insufficient credits', async () => {
      // Setup mock for this specific test
      mockPrismaService.player.findUnique.mockResolvedValueOnce({
        id: playerId,
        username: 'testplayer',
        credits: 0,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/gacha/open')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ packType: 'BASIC' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Insufficient credits');
    });
  });
});
