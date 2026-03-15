import { Test, TestingModule } from '@nestjs/testing';
import { PvPMatchmakingService } from './pvp-matchmaking.service';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BattleService } from '../battle/battle.service';

describe('PvPMatchmakingService', () => {
  let service: PvPMatchmakingService;
  let redisService: RedisService;
  let prismaService: PrismaService;
  let battleService: BattleService;

  const mockRedisService = {
    addToQueue: jest.fn(),
    removeFromQueue: jest.fn(),
    popFromQueue: jest.fn(),
    getQueueLength: jest.fn(),
    hset: jest.fn(),
    hget: jest.fn(),
    hdel: jest.fn(),
  };

  const mockPrismaService = {
    pvPMatch: {
      create: jest.fn(),
    },
  };

  const mockBattleService = {
    getParticipant: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PvPMatchmakingService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: BattleService, useValue: mockBattleService },
      ],
    }).compile();

    service = module.get<PvPMatchmakingService>(PvPMatchmakingService);
    redisService = module.get<RedisService>(RedisService);
    prismaService = module.get<PrismaService>(PrismaService);
    battleService = module.get<BattleService>(BattleService);
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

      const result = await service.joinQueue('p1', ['card1']);

      expect(mockRedisService.removeFromQueue).toHaveBeenCalledWith('pvp_matchmaking_queue', 'p1');
      expect(mockRedisService.hset).toHaveBeenCalledWith('pvp_decks', 'p1', JSON.stringify(['card1']));
      expect(mockRedisService.addToQueue).toHaveBeenCalledWith('pvp_matchmaking_queue', 'p1');
      expect(result).toEqual({ status: 'QUEUED' });
    });

    it('should return MATCHED if match found', async () => {
      mockRedisService.getQueueLength.mockResolvedValueOnce(2);
      mockRedisService.popFromQueue.mockResolvedValueOnce('p1').mockResolvedValueOnce('p2');
      mockRedisService.hget.mockResolvedValueOnce(JSON.stringify(['c1'])).mockResolvedValueOnce(JSON.stringify(['c2']));

      const mockParticipant1 = { id: 'p1', cards: [] };
      const mockParticipant2 = { id: 'p2', cards: [] };
      mockBattleService.getParticipant.mockResolvedValueOnce(mockParticipant1).mockResolvedValueOnce(mockParticipant2);

      const mockMatch = { id: 'match-1', player1Id: 'p1', player2Id: 'p2' };
      mockPrismaService.pvPMatch.create.mockResolvedValue(mockMatch);

      const result = await service.joinQueue('p1', ['c1']);

      expect(result.status).toBe('MATCHED');
      expect(result.match).toEqual({
        ...mockMatch,
        participants: { p1: mockParticipant1, p2: mockParticipant2 },
      });
      expect(mockPrismaService.pvPMatch.create).toHaveBeenCalled();
      expect(mockRedisService.hdel).toHaveBeenCalledWith('pvp_decks', 'p1');
      expect(mockRedisService.hdel).toHaveBeenCalledWith('pvp_decks', 'p2');
    });
  });

  describe('leaveQueue', () => {
    it('should remove player from queue and delete deck', async () => {
      const result = await service.leaveQueue('p1');
      expect(mockRedisService.removeFromQueue).toHaveBeenCalledWith('pvp_matchmaking_queue', 'p1');
      expect(mockRedisService.hdel).toHaveBeenCalledWith('pvp_decks', 'p1');
      expect(result).toEqual({ status: 'LEFT_QUEUE' });
    });
  });
});
