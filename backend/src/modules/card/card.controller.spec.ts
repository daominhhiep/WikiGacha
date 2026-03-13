import { Test, TestingModule } from '@nestjs/testing';
import { GachaController, OpenPackDto, PackType } from './card.controller';
import { CardService } from './card.service';

describe('GachaController', () => {
  let controller: GachaController;
  let cardService: CardService;

  const mockCardService = {
    openPack: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GachaController],
      providers: [{ provide: CardService, useValue: mockCardService }],
    }).compile();

    controller = module.get<GachaController>(GachaController);
    cardService = module.get<CardService>(CardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('openPack', () => {
    it('should call cardService.openPack', async () => {
      const req = { user: { userId: 'p1' } };
      const dto: OpenPackDto = { packType: PackType.BASIC };
      mockCardService.openPack.mockResolvedValue({ newCards: [] });

      const result = await controller.openPack(req as any, dto);

      expect(cardService.openPack).toHaveBeenCalledWith('p1');
      expect(result).toHaveProperty('newCards');
    });
  });
});
