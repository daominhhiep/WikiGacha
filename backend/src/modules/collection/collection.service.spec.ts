import { Test, TestingModule } from '@nestjs/testing';
import { CollectionService } from './collection.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Rarity } from '../../generated/prisma/enums';

describe('CollectionService', () => {
  let service: CollectionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    inventory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CollectionService>(CollectionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlayerCollection', () => {
    it('should return paginated player collection', async () => {
      const playerId = 'player-1';
      const mockItems = [
        {
          id: 'inv-1',
          playerId,
          cardId: 'card-1',
          isFavorite: false,
          card: { id: 'card-1', title: 'Card 1', rarity: Rarity.C },
        },
      ];

      mockPrismaService.inventory.findMany.mockResolvedValue(mockItems);
      mockPrismaService.inventory.count = jest.fn().mockResolvedValue(1);

      const result = await service.getPlayerCollection(playerId, { page: 1, limit: 20 });

      expect(result.items).toEqual(mockItems);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.inventory.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.any(Object),
        skip: 0,
        take: 20,
      }));
    });
  });

  describe('getCardInCollection', () => {
    it('should return card details if in collection', async () => {
      const playerId = 'player-1';
      const cardId = 'card-1';
      const mockItem = {
        id: 'inv-1',
        playerId,
        cardId,
        card: { id: cardId, title: 'Card 1' },
      };

      mockPrismaService.inventory.findFirst.mockResolvedValue(mockItem);

      const result = await service.getCardInCollection(playerId, cardId);

      expect(result).toEqual(mockItem);
      expect(prisma.inventory.findFirst).toHaveBeenCalledWith({
        where: { playerId, cardId },
        include: { card: true },
      });
    });

    it('should throw NotFoundException if card not in collection', async () => {
      const playerId = 'player-1';
      const cardId = 'card-not-owned';

      mockPrismaService.inventory.findFirst.mockResolvedValue(null);

      await expect(service.getCardInCollection(playerId, cardId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const playerId = 'player-1';
      const inventoryId = 'inv-1';
      const mockItem = { id: inventoryId, playerId, isFavorite: false };
      const updatedItem = { ...mockItem, isFavorite: true };

      mockPrismaService.inventory.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.inventory.update.mockResolvedValue(updatedItem);

      const result = await service.toggleFavorite(playerId, inventoryId);

      expect(result.isFavorite).toBe(true);
      expect(prisma.inventory.update).toHaveBeenCalledWith({
        where: { id: inventoryId },
        data: { isFavorite: true },
      });
    });

    it('should throw NotFoundException if inventory item not found', async () => {
      mockPrismaService.inventory.findFirst.mockResolvedValue(null);

      await expect(service.toggleFavorite('p1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
