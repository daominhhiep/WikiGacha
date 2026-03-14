import { Test, TestingModule } from '@nestjs/testing';
import { PvPMatchmakingService } from './pvp-matchmaking.service';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('PvPMatchmakingService', () => {
  let service: PvPMatchmakingService;
  let redisService: RedisService;
  let prismaService: PrismaService;

  const mockRedisService = {
    addToQueue: jest.fn(),
    removeFromQueue: jest.fn(),
    popFromQueue: jest.fn(),
    getQueueLength: jest.fn(),
  };

  const mockPrismaService = {
    pvPMatch: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PvPMatchmakingService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<PvPMatchmakingService>(PvPMatchmakingService);
    redisService = module.get<RedisService>(RedisService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinQueue', () => {
    it('should add player to queue and return QUEUED if no match found', async () => {
      mockRedisService.getQueueLength.mockResolvedValue(1);
      
      const result = await service.joinQueue('p1');
      
      expect(mockRedisService.removeFromQueue).toHaveBeenCalledWith('pvp_matchmaking_queue', 'p1');
      expect(mockRedisService.addToQueue).toHaveBeenCalledWith('pvp_matchmaking_queue', 'p1');
      expect(result).toEqual({ status: 'QUEUED' });
    });

    it('should return MATCHED if match found', async () => {
      mockRedisService.getQueueLength.mockResolvedValueOnce(2);
      mockRedisService.popFromQueue
        .mockResolvedValueOnce('p1')
        .mockResolvedValueOnce('p2');
      
      const mockMatch = { id: 'match-1', player1Id: 'p1', player2Id: 'p2' };
      mockPrismaService.pvPMatch.create.mockResolvedValue(mockMatch);
      
      const result = await service.joinQueue('p1');
      
      expect(result.status).toBe('MATCHED');
      expect(result.match).toEqual(mockMatch);
      expect(mockPrismaService.pvPMatch.create).toHaveBeenCalled();
    });
  });

  describe('leaveQueue', () => {
    it('should remove player from queue', async () => {
      const result = await service.leaveQueue('p1');
      expect(mockRedisService.removeFromQueue).toHaveBeenCalledWith('pvp_matchmaking_queue', 'p1');
      expect(result).toEqual({ status: 'LEFT_QUEUE' });
    });
  });
});
