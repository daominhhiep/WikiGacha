import { Test, TestingModule } from '@nestjs/testing';
import { BattleService } from './battle.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BattleEngine } from './battle-engine';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

// Mock BattleEngine
jest.mock('./battle-engine');

describe('BattleService', () => {
  let service: BattleService;
  let prisma: PrismaService;
  let engine: jest.Mocked<BattleEngine>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

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

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BattleService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<BattleService>(BattleService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2) as jest.Mocked<EventEmitter2>;
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
      (engine.simulate as jest.Mock).mockReturnValue(mockSimulationResult as any);
      mockPrismaService.battle.create.mockResolvedValue({ id: 'battle-1' });
      mockPrismaService.player.findUnique.mockResolvedValue({ xp: 100, level: 1 });

      const result = await service.startBattle(playerId, deckIds);

      expect(result.battleId).toBe('battle-1');
      expect(prisma.battle.create).toHaveBeenCalled();
      expect(prisma.player.update).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith('battle.won', {
        playerId,
        winnerId: playerId,
        isWinner: true,
      });
    });

    it('should complete PvP battle and return Elo updates', async () => {
      const opponentId = 'p2';
      const mockInventoryP1 = [
        { id: 'inv-1', card: { title: 'Card 1', hp: 100, atk: 10, def: 10, rarity: 'C' } },
      ];
      const mockInventoryP2 = [
        { id: 'inv-2', card: { title: 'Card 2', hp: 100, atk: 10, def: 10, rarity: 'C' } },
      ];
      const mockSimulationResult = {
        winnerId: playerId,
        log: [],
        participants: {
          p1: { id: playerId, cards: [] },
          p2: { id: opponentId, cards: [] },
        },
      };

      mockPrismaService.inventory.findMany
        .mockResolvedValueOnce(mockInventoryP1)
        .mockResolvedValueOnce(mockInventoryP2);
      (engine.simulate as jest.Mock).mockReturnValue(mockSimulationResult as any);
      mockPrismaService.player.findUnique
        .mockResolvedValueOnce({ id: playerId, eloRating: 1200, xp: 0, level: 1 })
        .mockResolvedValueOnce({ id: opponentId, eloRating: 1200, xp: 0, level: 1 })
        .mockResolvedValueOnce({ id: playerId, eloRating: 1216, xp: 100, level: 1 }); // for level up check

      mockPrismaService.battle.create.mockResolvedValue({ id: 'battle-pvp' });

      const result = await service.startBattle(playerId, deckIds, opponentId);

      expect(result.battleId).toBe('battle-pvp');
      expect(result.elo).toBeDefined();
      expect(result.elo.player1.new).toBeGreaterThan(1200);
      expect(result.elo.player2.new).toBeLessThan(1200);

      // Verify updates for both players
      expect(prisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: opponentId } }),
      );
      expect(prisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: playerId } }),
      );
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
