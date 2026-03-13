import { Test, TestingModule } from '@nestjs/testing';
import { CardService } from './card.service';
import { WikiService } from './wiki.service';
import { PrismaService } from './../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { Rarity } from '../../generated/prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('CardService', () => {
  let service: CardService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockPrismaService = {
    player: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    card: {
      count: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    inventory: {
      createMany: jest.fn(),
    },
  };

  const mockWikiService = {
    getRandomArticles: jest.fn(),
    getBatchArticlesData: jest.fn(),
    getWikiRankScore: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: WikiService, useValue: mockWikiService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('openPack', () => {
    const playerId = 'test-player';
    const mockPlayer = { id: playerId, credits: 100, pityCounter: 0 };

    it('should throw error if player not found', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);
      await expect(service.openPack(playerId)).rejects.toThrow(BadRequestException);
    });

    it('should throw error if insufficient credits', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue({ ...mockPlayer, credits: 5 });
      await expect(service.openPack(playerId)).rejects.toThrow('Insufficient credits');
    });

    it('should pull cards from pool and update state', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockRedisService.get.mockResolvedValue('100'); // Cached count
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 'card-1', rarity: Rarity.C }]);
      mockPrismaService.player.update.mockResolvedValue({ credits: 90, pityCounter: 1 });

      const result = await service.openPack(playerId);

      expect(result.newCards).toHaveLength(5);
      expect(prisma.player.update).toHaveBeenCalled();
      expect(prisma.inventory.createMany).toHaveBeenCalled();
      expect(redis.get).toHaveBeenCalledWith('gacha:pool:count');
    });

    it('should fetch from DB and cache if count is not in Redis', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.card.count.mockResolvedValue(50);
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 'card-1', rarity: Rarity.C }]);
      mockPrismaService.player.update.mockResolvedValue({ credits: 90, pityCounter: 1 });

      await service.openPack(playerId);

      expect(prisma.card.count).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalledWith('gacha:pool:count', '50', 'EX', 60);
    });

    it('should cache for 24 hours if count >= 50,000', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.card.count.mockResolvedValue(55000);
      mockPrismaService.card.findMany.mockResolvedValue([{ id: 'card-1', rarity: Rarity.C }]);
      mockPrismaService.player.update.mockResolvedValue({ credits: 90, pityCounter: 1 });

      await service.openPack(playerId);

      expect(redis.set).toHaveBeenCalledWith('gacha:pool:count', '55000', 'EX', 86400);
    });
  });

  describe('generateCardFromWiki', () => {
    it('should generate card with correct stats for FA article', async () => {
      const mockWikiData = {
        pageid: 123,
        title: 'FA Article',
        extract: 'Summary',
        content_urls: { desktop: { page: 'url' } },
      };

      mockPrismaService.card.upsert.mockImplementation(({ create }) => Promise.resolve(create));

      const result = await service.generateCardFromWiki(
        mockWikiData as any,
        10000, // pageViews
        10,    // languageCount
        { enwiki: 'FA' },
        5000,  // length
      );

      expect(result.rarity).toBe(Rarity.LR);
      expect(result.hp).toBeGreaterThan(100);
      expect(prisma.card.upsert).toHaveBeenCalled();
    });

    it('should use synthetic Q-Score if no assessments provided', async () => {
      const mockWikiData = {
        pageid: 456,
        title: 'Normal Article',
        extract: 'Summary',
      };

      mockPrismaService.card.upsert.mockImplementation(({ create }) => Promise.resolve(create));

      const result = await service.generateCardFromWiki(
        mockWikiData as any,
        100,
        2,
        undefined,
        1000,
      );

      expect(result.rarity).toBeDefined();
    });
  });

  describe('refillPool', () => {
    it('should fetch and generate multiple cards', async () => {
      mockWikiService.getRandomArticles.mockResolvedValue(['A', 'B']);
      mockWikiService.getBatchArticlesData.mockResolvedValue({
        'A': { pageid: 1, title: 'A', pageViews: 10, languageCount: 1, length: 100 },
        'B': { pageid: 2, title: 'B', pageViews: 20, languageCount: 2, length: 200 },
      });
      mockWikiService.getWikiRankScore.mockResolvedValue({ quality: 50, popularity: 50 });
      mockPrismaService.card.count.mockResolvedValue(100);

      await service.refillPool(2);

      expect(prisma.card.upsert).toHaveBeenCalledTimes(2);
      expect(redis.set).toHaveBeenCalledWith('gacha:pool:count', '100', 'EX', 60);
    });
  });
});
