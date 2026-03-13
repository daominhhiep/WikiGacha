import { Test, TestingModule } from '@nestjs/testing';
import { CollectionService } from './collection.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { SortOption } from './dto/collection-query.dto';

describe('CollectionService', () => {
  let service: CollectionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    inventory: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollectionService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<CollectionService>(CollectionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlayerCollection', () => {
    it('should return paginated collection', async () => {
      mockPrismaService.inventory.findMany.mockResolvedValue([]);
      mockPrismaService.inventory.count.mockResolvedValue(0);

      const result = await service.getPlayerCollection('p1', { page: 1, limit: 10 });

      expect(result.items).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should handle sorting and search', async () => {
      mockPrismaService.inventory.findMany.mockResolvedValue([]);
      mockPrismaService.inventory.count.mockResolvedValue(0);

      await service.getPlayerCollection('p1', {
        page: 1,
        limit: 10,
        search: 'test',
        sortBy: SortOption.ALPHABETICAL,
      });

      expect(mockPrismaService.inventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            card: expect.objectContaining({
              AND: expect.arrayContaining([{ title: { contains: 'test' } }]),
            }),
          }),
          orderBy: { card: { title: 'asc' } },
        }),
      );
    });
  });

  describe('getCardInCollection', () => {
    it('should throw NotFoundException if card not found', async () => {
      mockPrismaService.inventory.findFirst.mockResolvedValue(null);
      await expect(service.getCardInCollection('p1', 'c1')).rejects.toThrow(NotFoundException);
    });

    it('should return card item if found', async () => {
      const mockItem = { id: 'i1', cardId: 'c1' };
      mockPrismaService.inventory.findFirst.mockResolvedValue(mockItem);
      const result = await service.getCardInCollection('p1', 'c1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      const mockItem = { id: 'i1', isFavorite: false };
      mockPrismaService.inventory.findFirst.mockResolvedValue(mockItem);
      mockPrismaService.inventory.update.mockResolvedValue({ ...mockItem, isFavorite: true });

      const result = await service.toggleFavorite('p1', 'i1');

      expect(result.isFavorite).toBe(true);
      expect(prisma.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isFavorite: true },
        }),
      );
    });

    it('should throw if item not found', async () => {
      mockPrismaService.inventory.findFirst.mockResolvedValue(null);
      await expect(service.toggleFavorite('p1', 'i1')).rejects.toThrow(NotFoundException);
    });
  });
});
