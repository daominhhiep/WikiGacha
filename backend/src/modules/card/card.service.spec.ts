import { Test, TestingModule } from '@nestjs/testing';
import { WikiService } from './wiki.service';
import { Rarity } from '../../generated/prisma/client';

// Mock PrismaService BEFORE it is imported by CardService
jest.mock('../../common/prisma/prisma.service', () => ({
  PrismaService: class {
    card = {
      upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    };
    player = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };
    inventory = {
      create: jest.fn(),
    };
  },
}));

// Import after mock
import { CardService } from './card.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('CardService', () => {
  let service: CardService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardService,
        PrismaService, // Use the mocked version
        {
          provide: WikiService,
          useValue: {
            getGlobalStats: jest.fn().mockResolvedValue({
              articleCount: 7000000,
              totalMonthlyViews: 10500000000, // Average = 1500
            }),
            getWikiRankScore: jest.fn().mockResolvedValue({ quality: 0, popularity: 0 }),
            getRandomArticles: jest.fn(),
            getTopArticles: jest.fn(),
            getBatchArticlesData: jest.fn(),
            getArticleStats: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CardService>(CardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('openPack', () => {
    it('should trigger pity and fetch top articles', async () => {
      const playerId = 'player-1';
      const mockPlayer = {
        id: playerId,
        credits: 1000,
        pityCounter: 9, // Next pack triggers pity (threshold=10)
      };

      (prisma.player.findUnique as jest.Mock).mockResolvedValue(mockPlayer);
      (prisma.player.update as jest.Mock).mockResolvedValue({ ...mockPlayer, pityCounter: 0 });

      const wikiService = (service as any).wikiService;
      wikiService.getRandomArticles.mockResolvedValue([
        'Article 1',
        'Article 2',
        'Article 3',
        'Article 4',
        'Article 5',
      ]);
      wikiService.getTopArticles.mockResolvedValue([
        'Top 1',
        'Top 2',
        'Top 3',
        'Top 4',
        'Top 5',
        'Top 6',
        'Top 7',
        'Top 8',
        'Top 9',
        'Top 10',
      ]);
      wikiService.getBatchArticlesData.mockImplementation((titles) => {
        const results = {};
        titles.forEach((title) => {
          results[title] = {
            pageid: Math.random() * 1000,
            title,
            extract: 'Summary',
            languageCount: 5,
            length: 1000,
            pageAssessments: {},
            content_urls: { desktop: { page: 'url' } },
          };
        });
        return Promise.resolve(results);
      });
      wikiService.getArticleStats.mockResolvedValue({ pageViews: 100, languageCount: 5 });
      wikiService.getWikiRankScore.mockResolvedValue({ quality: 0, popularity: 0 });

      const result = await service.openPack(playerId);

      expect(wikiService.getTopArticles).toHaveBeenCalled();
      // The last card title should have been replaced with something from topArticles
      const lastCard = result.newCards[4];
      expect(lastCard.title).toMatch(/Top [0-9]+/);
    });
  });

  describe('deriveRarity', () => {
    it('should return C for low Q-Score', () => {
      expect((service as any).deriveRarity(10)).toBe(Rarity.C);
    });
    it('should return UC for moderate Q-Score', () => {
      expect((service as any).deriveRarity(25)).toBe(Rarity.UC);
    });
    it('should return R for decent Q-Score', () => {
      expect((service as any).deriveRarity(40)).toBe(Rarity.R);
    });
    it('should return SR for high Q-Score', () => {
      expect((service as any).deriveRarity(65)).toBe(Rarity.SR);
    });
    it('should return SSR for very high Q-Score', () => {
      expect((service as any).deriveRarity(85)).toBe(Rarity.SSR);
    });
    it('should return UR for elite Q-Score', () => {
      expect((service as any).deriveRarity(95)).toBe(Rarity.UR);
    });
    it('should return LR for max Q-Score', () => {
      expect((service as any).deriveRarity(100)).toBe(Rarity.LR);
    });
  });

  describe('generateCardFromWiki', () => {
    it('should generate a card with correct stats using WikiRank score', async () => {
      const mockWikiData = {
        pageid: 123,
        title: 'Test Article',
        extract: 'This is a test summary with some length to it.',
        thumbnail: 'https://example.com/img.jpg',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Test' } },
      };

      // Quality Assess: WikiRank 95 -> UR
      const result = await service.generateCardFromWiki(
        mockWikiData,
        150000,
        50,
        {},
        10000,
        95, // quality
        100, // popularity
      );

      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Article');
      expect(result.rarity).toBe(Rarity.UR);
      expect((result as any).quality).toBe(95);
      expect((result as any).popularity).toBe(100);
      expect(result.hp).toBeGreaterThan(100);
      expect(result.atk).toBeGreaterThan(10);
      expect(result.def).toBeGreaterThan(10);
      expect(prisma.card.upsert).toHaveBeenCalled();
    });

    it('should fallback to internal Q-Score if WikiRank quality is 0', async () => {
      const mockWikiData = {
        pageid: 456,
        title: 'Fallback Article',
        extract: 'Summary',
        content_urls: { desktop: { page: 'url' } },
      };

      // Internal: FA -> QScore 100 -> LR
      const result = await service.generateCardFromWiki(
        mockWikiData,
        1000,
        10,
        { en: 'FA' },
        5000,
        0, // quality 0
        0, // popularity 0
      );

      expect(result.rarity).toBe(Rarity.LR);
    });
  });
});
