import { Test, TestingModule } from '@nestjs/testing';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';

describe('BattleController', () => {
  let controller: BattleController;
  let battleService: BattleService;

  const mockBattleService = {
    startBattle: jest.fn(),
    getBattleHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BattleController],
      providers: [
        { provide: BattleService, useValue: mockBattleService },
      ],
    }).compile();

    controller = module.get<BattleController>(BattleController);
    battleService = module.get<BattleService>(BattleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('startBattle', () => {
    it('should call battleService.startBattle', async () => {
      const req = { user: { userId: 'p1' } };
      const dto = { deckIds: ['inv-1'] };
      mockBattleService.startBattle.mockResolvedValue({ battleId: '1' });
      
      const result = await controller.startBattle(req, dto);
      
      expect(battleService.startBattle).toHaveBeenCalledWith('p1', ['inv-1'], undefined);
      expect(result.battleId).toBe('1');
    });
  });

  describe('getHistory', () => {
    it('should call battleService.getBattleHistory', async () => {
      const req = { user: { userId: 'p1' } };
      mockBattleService.getBattleHistory.mockResolvedValue([]);
      
      const result = await controller.getHistory(req);
      
      expect(battleService.getBattleHistory).toHaveBeenCalledWith('p1');
      expect(result).toEqual([]);
    });
  });
});
