import { Test, TestingModule } from '@nestjs/testing';
import { TrophyService } from './trophy.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Rarity } from '../../generated/prisma/client';

describe('TrophyService', () => {
  let service: TrophyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    trophy: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    battle: {
      count: jest.fn(),
    },
    pvPMatch: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrophyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TrophyService>(TrophyService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleCardPulled', () => {
    it('should award LEGENDARY_FINDER trophy if UR card is pulled', async () => {
      mockPrismaService.trophy.findFirst.mockResolvedValue(null);
      const payload = {
        playerId: 'player1',
        cards: [{ rarity: Rarity.UR }],
      };

      await service.handleCardPulled(payload);

      expect(prisma.trophy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          playerId: 'player1',
          name: 'LEGENDARY_FINDER',
        }),
      });
    });

    it('should not award trophy if already exists', async () => {
      mockPrismaService.trophy.findFirst.mockResolvedValue({ id: 1 });
      const payload = {
        playerId: 'player1',
        cards: [{ rarity: Rarity.LR }],
      };

      await service.handleCardPulled(payload);

      expect(prisma.trophy.create).not.toHaveBeenCalled();
    });

    it('should not award trophy if no UR/LR cards', async () => {
      const payload = {
        playerId: 'player1',
        cards: [{ rarity: Rarity.SSR }],
      };

      await service.handleCardPulled(payload);

      expect(prisma.trophy.create).not.toHaveBeenCalled();
    });
  });

  describe('handleBattleWon', () => {
    it('should award VETERAN_COMMANDER if winCount >= 10', async () => {
      mockPrismaService.battle.count.mockResolvedValue(10);
      mockPrismaService.pvPMatch.count.mockResolvedValue(0);
      mockPrismaService.trophy.findFirst.mockResolvedValue(null);

      await service.handleBattleWon({ playerId: 'player1', isWinner: true });

      expect(prisma.trophy.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          playerId: 'player1',
          name: 'VETERAN_COMMANDER',
        }),
      });
    });

    it('should not award if winCount < 10', async () => {
      mockPrismaService.battle.count.mockResolvedValue(5);
      mockPrismaService.pvPMatch.count.mockResolvedValue(4);

      await service.handleBattleWon({ playerId: 'player1', isWinner: true });

      expect(prisma.trophy.create).not.toHaveBeenCalled();
    });
  });
});
