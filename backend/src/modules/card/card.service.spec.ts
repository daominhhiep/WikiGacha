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

  describe('deriveRarity', () => {
    it('should return N for low views', () => {
      expect((service as any).deriveRarity(100, 1500)).toBe(Rarity.N);
    });
    it('should return R for moderate views', () => {
      // 30000 >= 10 * 1500
      expect((service as any).deriveRarity(30000, 1500)).toBe(Rarity.R);
    });
    it('should return S for moderately high views', () => {
      // 80000 >= 50 * 1500 (75k)
      expect((service as any).deriveRarity(80000, 1500)).toBe(Rarity.S);
    });
    it('should return SR for high views', () => {
      // 250000 >= 150 * 1500 (225k)
      expect((service as any).deriveRarity(250000, 1500)).toBe(Rarity.SR);
    });
    it('should return SSR for very high views', () => {
      // 1000000 >= 500 * 1500 (750k)
      expect((service as any).deriveRarity(1000000, 1500)).toBe(Rarity.SSR);
    });
  });

  describe('generateCardFromWiki', () => {
    it('should generate a card with correct stats', async () => {
      const mockWikiData = {
        pageid: 123,
        title: 'Test Article',
        extract: 'This is a test summary with some length to it.',
        thumbnail: 'https://example.com/img.jpg',
        content_urls: { desktop: { page: 'https://en.wikipedia.org/wiki/Test' } },
      };

      const result = await service.generateCardFromWiki(mockWikiData, 150000, 50);

      expect(result.id).toBe('123');
      expect(result.title).toBe('Test Article');
      expect(result.rarity).toBe(Rarity.S); // 150k views >= 50 * 1500 (75k) but < 150 * 1500 (225k) -> S
      expect(result.hp).toBeGreaterThan(50); // Base 50 + bonus
      expect(result.atk).toBeGreaterThan(10); // Base 10 + bonus
      expect(result.def).toBeGreaterThan(10); // Base 10 + bonus
      expect(prisma.card.upsert).toHaveBeenCalled();
    });
  });
});
