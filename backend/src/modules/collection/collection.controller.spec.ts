import { Test, TestingModule } from '@nestjs/testing';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionQueryDto } from './dto/collection-query.dto';

describe('CollectionController', () => {
  let controller: CollectionController;
  let collectionService: CollectionService;

  const mockCollectionService = {
    getPlayerCollection: jest.fn(),
    getCardInCollection: jest.fn(),
    toggleFavorite: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CollectionController],
      providers: [{ provide: CollectionService, useValue: mockCollectionService }],
    }).compile();

    controller = module.get<CollectionController>(CollectionController);
    collectionService = module.get<CollectionService>(CollectionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCollection', () => {
    it('should call collectionService.getPlayerCollection', async () => {
      const req = { user: { userId: 'p1' } };
      const query: CollectionQueryDto = { page: 1, limit: 20 };
      mockCollectionService.getPlayerCollection.mockResolvedValue({ items: [], meta: {} });

      const result = await controller.getCollection(req as any, query);

      expect(collectionService.getPlayerCollection).toHaveBeenCalledWith('p1', query);
      expect(result).toHaveProperty('items');
    });
  });

  describe('getCard', () => {
    it('should call collectionService.getCardInCollection', async () => {
      const req = { user: { userId: 'p1' } };
      mockCollectionService.getCardInCollection.mockResolvedValue({});

      const result = await controller.getCard(req as any, 'c1');

      expect(collectionService.getCardInCollection).toHaveBeenCalledWith('p1', 'c1');
      expect(result).toBeDefined();
    });
  });

  describe('toggleFavorite', () => {
    it('should call collectionService.toggleFavorite', async () => {
      const req = { user: { userId: 'p1' } };
      mockCollectionService.toggleFavorite.mockResolvedValue({});

      const result = await controller.toggleFavorite(req as any, 'i1');

      expect(collectionService.toggleFavorite).toHaveBeenCalledWith('p1', 'i1');
      expect(result).toBeDefined();
    });
  });
});
