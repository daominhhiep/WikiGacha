import { Test, TestingModule } from '@nestjs/testing';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('MissionController', () => {
  let controller: MissionController;
  let missionService: MissionService;

  const mockMissionService = {
    getPlayerMissions: jest.fn(),
    claimReward: jest.fn(),
    assignInitialMissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MissionController],
      providers: [{ provide: MissionService, useValue: mockMissionService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MissionController>(MissionController);
    missionService = module.get<MissionService>(MissionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlayerMissions', () => {
    it('should call missionService.getPlayerMissions', async () => {
      mockMissionService.getPlayerMissions.mockResolvedValue([]);
      const result = await controller.getPlayerMissions('p1');
      expect(missionService.getPlayerMissions).toHaveBeenCalledWith('p1');
      expect(result).toEqual([]);
    });
  });

  describe('claimReward', () => {
    it('should call missionService.claimReward', async () => {
      const dto = { userId: 'p1', userMissionId: 1 };
      mockMissionService.claimReward.mockResolvedValue({ success: true });
      const result = await controller.claimReward(dto);
      expect(missionService.claimReward).toHaveBeenCalledWith('p1', 1);
      expect(result).toEqual({ success: true });
    });
  });
});
