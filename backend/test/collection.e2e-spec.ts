import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Rarity } from '../src/generated/prisma/enums';

// Mock PrismaService BEFORE importing AppModule
jest.mock('./../src/common/prisma/prisma.service', () => ({
  PrismaService: class {
    onModuleInit = jest.fn();
    onModuleDestroy = jest.fn();
    player = {
      findUnique: jest.fn(),
    };
    inventory = {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    };
    card = {
      findUnique: jest.fn(),
    };
  },
}));

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { RedisService } from './../src/common/redis/redis.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';

describe('CollectionController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accessToken: string;
  const playerId = 'test-player-id';

  const mockRedisService = {
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
  };

  const mockPrismaService = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    inventory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
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

  describe('GET /api/v1/collection', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/v1/collection').expect(401);
    });

    it('should return paginated player collection if authenticated', async () => {
      const mockInventory = [
        {
          id: 'inv-1',
          playerId,
          cardId: 'card-1',
          isFavorite: false,
          card: { id: 'card-1', title: 'Test Card', rarity: Rarity.C },
        },
      ];

      mockPrismaService.inventory.findMany.mockResolvedValue(mockInventory);
      mockPrismaService.inventory.count = jest.fn().mockResolvedValue(1);

      const response = await request(app.getHttpServer())
        .get('/api/v1/collection')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].card.title).toBe('Test Card');
      expect(response.body.data.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  describe('GET /api/v1/collection/:cardId', () => {
    it('should return card details if owned', async () => {
      const cardId = 'card-1';
      const mockItem = {
        id: 'inv-1',
        playerId,
        cardId,
        card: { id: cardId, title: 'Test Card' },
      };

      mockPrismaService.inventory.findFirst.mockResolvedValue(mockItem);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/collection/${cardId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.card.title).toBe('Test Card');
    });

    it('should return 404 if card not in collection', async () => {
      mockPrismaService.inventory.findFirst.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/v1/collection/not-owned')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/collection/:inventoryId/favorite', () => {
    it('should toggle favorite status', async () => {
      const inventoryId = 'inv-1';
      const mockItem = { id: inventoryId, playerId, isFavorite: false };
      const updatedItem = { ...mockItem, isFavorite: true };

      mockPrismaService.inventory.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.inventory.update.mockResolvedValue(updatedItem);

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/collection/${inventoryId}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFavorite).toBe(true);
    });
  });
});
