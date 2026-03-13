import { Test, TestingModule } from '@nestjs/testing';
import { BattleService } from './battle.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BattleEngine } from './battle-engine';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock BattleEngine
jest.mock('./battle-engine');

describe('BattleService', () => {
  let service: BattleService;
  let prisma: PrismaService;
  let engine: jest.Mocked<BattleEngine>;

  const mockPrismaService = {
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
    player: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BattleService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<BattleService>(BattleService);
    prisma = module.get<PrismaService>(PrismaService);
    engine = (service as any).engine;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startBattle', () => {
    const playerId = 'p1';
    const deckIds = ['inv-1'];

    it('should throw BadRequestException if deck is empty', async () => {
      await expect(service.startBattle(playerId, [])).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if cards not found', async () => {
      mockPrismaService.inventory.findMany.mockResolvedValue([]);
      await expect(service.startBattle(playerId, deckIds)).rejects.toThrow(NotFoundException);
    });

    it('should complete PvE battle and return results', async () => {
      const mockInventory = [
        { id: 'inv-1', card: { title: 'Card 1', hp: 100, atk: 10, def: 10, rarity: 'C' } },
      ];
      const mockAiCards = [{ id: 'card-2', title: 'AI Card', hp: 50, atk: 5, def: 5, rarity: 'C' }];
      const mockSimulationResult = {
        winnerId: playerId,
        log: [],
        participants: { p1: { id: playerId, cards: [] }, p2: { id: 'AI', cards: [] } },
      };

      mockPrismaService.inventory.findMany.mockResolvedValue(mockInventory);
      mockPrismaService.card.findMany.mockResolvedValue(mockAiCards);
      engine.simulate.mockReturnValue(mockSimulationResult as any);
      mockPrismaService.battle.create.mockResolvedValue({ id: 'battle-1' });
      mockPrismaService.player.findUnique.mockResolvedValue({ xp: 100, level: 1 });

      const result = await service.startBattle(playerId, deckIds);

      expect(result.battleId).toBe('battle-1');
      expect(prisma.battle.create).toHaveBeenCalled();
      expect(prisma.player.update).toHaveBeenCalled();
    });
  });

  describe('getBattleHistory', () => {
    it('should return battle history', async () => {
      mockPrismaService.battle.findMany.mockResolvedValue([]);
      const result = await service.getBattleHistory('p1');
      expect(result).toEqual([]);
    });
  });
});
