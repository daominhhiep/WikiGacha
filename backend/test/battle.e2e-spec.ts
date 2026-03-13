import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { BattleStatus } from '../src/generated/prisma/enums';

// Mock PrismaService
jest.mock('./../src/common/prisma/prisma.service', () => ({
  PrismaService: class {
    onModuleInit = jest.fn();
    onModuleDestroy = jest.fn();
    player = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };
    inventory = {
      findMany: jest.fn(),
    };
    card = {
      findMany: jest.fn(),
    };
    battle = {
      create: jest.fn(),
      findMany: jest.fn(),
    };
  },
}));

import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { RedisService } from './../src/common/redis/redis.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';

describe('BattleController (e2e)', () => {
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
    player: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventory: {
      findMany: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
    },
    battle: {
      create: jest.fn(),
      findMany: jest.fn(),
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

  describe('POST /api/v1/battle/start', () => {
    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/battle/start')
        .send({ deckIds: ['card-1'] })
        .expect(401);
    });

    it('should start a battle and return results', async () => {
      const deckIds = ['card-1'];
      const mockInventory = [
        {
          id: 'inv-1',
          playerId,
          cardId: 'card-1',
          card: { id: 'card-1', title: 'Test Card', hp: 100, atk: 20, def: 5 },
        },
      ];

      const mockAiCards = [
        { id: 'ai-card-1', title: 'AI Card', hp: 50, atk: 10, def: 2, createdAt: new Date() },
      ];

      const mockBattle = {
        id: 'battle-1',
        player1Id: playerId,
        player2Id: null,
        winnerId: playerId,
        log: [],
        status: BattleStatus.COMPLETED,
      };

      mockPrismaService.inventory.findMany.mockResolvedValue(mockInventory);
      mockPrismaService.card.findMany.mockResolvedValue(mockAiCards);
      mockPrismaService.battle.create.mockResolvedValue(mockBattle);
      mockPrismaService.player.findUnique.mockResolvedValue({ id: playerId, xp: 100 });
      mockPrismaService.player.update.mockResolvedValue({ id: playerId, credits: 150, xp: 200, level: 1 });

      const response = await request(app.getHttpServer())
        .post('/api/v1/battle/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ deckIds })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('battleId');
      expect(response.body.data).toHaveProperty('winnerId');
      expect(response.body.data).toHaveProperty('log');
      expect(response.body.data).toHaveProperty('rewards');
      expect(response.body.data.rewards.credits).toBe(50); // Win reward

      expect(mockPrismaService.battle.create).toHaveBeenCalled();
      expect(mockPrismaService.player.update).toHaveBeenCalled();
    });

    it('should return 400 if deck is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/battle/start')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ deckIds: [] })
        .expect(400);
    });
  });

  describe('GET /api/v1/battle/history', () => {
    it('should return battle history', async () => {
      const mockHistory = [
        {
          id: 'battle-1',
          player1Id: playerId,
          player2Id: null,
          winnerId: playerId,
          status: BattleStatus.COMPLETED,
          player1: { id: playerId, username: 'testplayer' },
          player2: null,
          winner: { id: playerId, username: 'testplayer' },
        },
      ];

      mockPrismaService.battle.findMany.mockResolvedValue(mockHistory);

      const response = await request(app.getHttpServer())
        .get('/api/v1/battle/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe('battle-1');
    });
  });
});
