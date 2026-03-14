import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PvPMatch } from '@prisma/client';

@Injectable()
export class PvPMatchmakingService {
  private readonly logger = new Logger(PvPMatchmakingService.name);
  private readonly QUEUE_NAME = 'pvp_matchmaking_queue';

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
  ) {}

  async joinQueue(playerId: string): Promise<{ status: string; match?: PvPMatch }> {
    this.logger.log(`Player ${playerId} joining PvP queue`);

    // Remove existing entries to prevent duplicates
    await this.redisService.removeFromQueue(this.QUEUE_NAME, playerId);

    await this.redisService.addToQueue(this.QUEUE_NAME, playerId);

    const match = await this.findMatch();
    if (match) {
      return { status: 'MATCHED', match };
    }

    return { status: 'QUEUED' };
  }

  async leaveQueue(playerId: string): Promise<{ status: string }> {
    this.logger.log(`Player ${playerId} leaving PvP queue`);
    await this.redisService.removeFromQueue(this.QUEUE_NAME, playerId);
    return { status: 'LEFT_QUEUE' };
  }

  async findMatch(): Promise<PvPMatch | null> {
    const queueLength = await this.redisService.getQueueLength(this.QUEUE_NAME);

    if (queueLength < 2) {
      return null;
    }

    const player1Id = await this.redisService.popFromQueue(this.QUEUE_NAME);
    const player2Id = await this.redisService.popFromQueue(this.QUEUE_NAME);

    if (!player1Id || !player2Id) {
      // Put back if we somehow popped null but expected length >= 2
      if (player1Id) await this.redisService.addToQueue(this.QUEUE_NAME, player1Id);
      if (player2Id) await this.redisService.addToQueue(this.QUEUE_NAME, player2Id);
      return null;
    }

    if (player1Id === player2Id) {
      // This shouldn't happen with the removeFromQueue in joinQueue,
      // but if it does, just put one back and try again.
      await this.redisService.addToQueue(this.QUEUE_NAME, player1Id);
      return this.findMatch();
    }

    this.logger.log(`Match found: ${player1Id} vs ${player2Id}`);

    const match = await this.prismaService.pvPMatch.create({
      data: {
        player1Id: player1Id,
        player2Id: player2Id,
        status: 'MATCHMAKING',
        logs: [],
      },
      include: {
        player1: {
          select: { id: true, username: true, avatarUrl: true, eloRating: true },
        },
        player2: {
          select: { id: true, username: true, avatarUrl: true, eloRating: true },
        },
      },
    });

    return match as PvPMatch;
  }
}
