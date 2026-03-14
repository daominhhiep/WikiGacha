import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/prisma/prisma.service';
import { WikiService } from './../src/modules/card/wiki.service';
import { RedisService } from './../src/common/redis/redis.service';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './../src/common/filters/all-exceptions.filter';
import { BattleStatus } from '../src/generated/prisma/enums';

describe('Full Game Loop (e2e)', () => {
  let app: INestApplication;
  const playerId = 'full-loop-player-id';
  const username = 'FullLoopTester';

  const mockCards = [
    { id: '1', title: 'Card 1', hp: 100, atk: 20, def: 10, rarity: 'C' },
    { id: '2', title: 'Card 2', hp: 100, atk: 20, def: 10, rarity: 'C' },
    { id: '3', title: 'Card 3', hp: 100, atk: 20, def: 10, rarity: 'C' },
    { id: '4', title: 'Card 4', hp: 100, atk: 20, def: 10, rarity: 'C' },
    { id: '5', title: 'Card 5', hp: 100, atk: 20, def: 10, rarity: 'C' },
  ];

  const mockInventory = mockCards.map((card, index) => ({
    id: `inv-${index + 1}`,
    playerId,
    cardId: card.id,
    acquiredAt: new Date(),
    isFavorite: false,
    card,
  }));

  const mockWikiService = {
    getRandomArticles: jest.fn().mockResolvedValue(['A', 'B', 'C', 'D', 'E']),
    getBatchArticlesData: jest.fn().mockResolvedValue({}),
    getWikiRankScore: jest.fn().mockResolvedValue({ quality: 50, popularity: 50 }),
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
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: playerId, ...data, credits: 100, pityCounter: 0, level: 1, xp: 0 })),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === playerId || where.username === username) {
          return Promise.resolve({ id: playerId, username, credits: 100, pityCounter: 0, level: 1, xp: 0 });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: playerId, username, credits: 90, pityCounter: 1, level: 1, xp: 0 })),
    },
    inventory: {
      createMany: jest.fn().mockResolvedValue({ count: 5 }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        if (where.playerId === playerId) {
          return Promise.resolve(mockInventory);
        }
        return Promise.resolve([]);
      }),
      count: jest.fn().mockResolvedValue(5),
    },
    card: {
      count: jest.fn().mockResolvedValue(100),
      findMany: jest.fn().mockResolvedValue(mockCards),
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    },
    battle: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'battle-123', ...data })),
      findMany: jest.fn().mockResolvedValue([]),
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

  it('should complete the full game loop: Auth -> Gacha -> Collection -> Battle', async () => {
    // 1. Auth: Guest Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/guest')
      .send({ username })
      .expect(201);

    const { accessToken } = loginRes.body.data;
    expect(accessToken).toBeDefined();

    // 2. Gacha: Open Pack
    const openPackRes = await request(app.getHttpServer())
      .post('/api/v1/gacha/open')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ packType: 'BASIC' })
      .expect(201);

    expect(openPackRes.body.success).toBe(true);
    expect(openPackRes.body.data.newCards).toHaveLength(5);

    // 3. Collection: View Inventory
    const collectionRes = await request(app.getHttpServer())
      .get('/api/v1/collection')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(collectionRes.body.success).toBe(true);
    expect(collectionRes.body.data.items).toHaveLength(5);
    const selectedInventoryIds = collectionRes.body.data.items.map(i => i.id);

    // 4. Battle: Start a combat simulation
    const battleRes = await request(app.getHttpServer())
      .post('/api/v1/battle/start')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ deckIds: selectedInventoryIds })
      .expect(201);

    expect(battleRes.body.success).toBe(true);
    expect(battleRes.body.data).toHaveProperty('battleId');
    expect(battleRes.body.data).toHaveProperty('winnerId');
    expect(battleRes.body.data).toHaveProperty('log');
    expect(battleRes.body.data).toHaveProperty('rewards');
    
    // Verify rewards are distributed
    expect(battleRes.body.data.rewards.credits).toBeGreaterThan(0);
    expect(battleRes.body.data.rewards.xp).toBeGreaterThan(0);
  });
});
