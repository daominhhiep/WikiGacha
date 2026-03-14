import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PvPMatch } from '../../generated/prisma/client';
import { BattleService } from '../battle/battle.service';

@Injectable()
export class PvPMatchmakingService {
  private readonly logger = new Logger(PvPMatchmakingService.name);
  private readonly QUEUE_NAME = 'pvp_matchmaking_queue';

  constructor(
    private readonly redisService: RedisService,
    private readonly prismaService: PrismaService,
    private readonly battleService: BattleService,
  ) {}

  async joinQueue(
    playerId: string,
    deckIds: string[],
  ): Promise<{ status: string; match?: PvPMatch }> {
    this.logger.log(`Player ${playerId} joining PvP queue with ${deckIds.length} cards`);

    // Remove existing entries to prevent duplicates
    await this.redisService.removeFromQueue(this.QUEUE_NAME, playerId);

    // Store deckIds for this player in Redis
    await this.redisService.hset('pvp_decks', playerId, JSON.stringify(deckIds));

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
    await this.redisService.hdel('pvp_decks', playerId);
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

    // Retrieve deckIds from Redis
    const [p1DeckRaw, p2DeckRaw] = await Promise.all([
      this.redisService.hget('pvp_decks', player1Id),
      this.redisService.hget('pvp_decks', player2Id),
    ]);

    const p1Deck = p1DeckRaw ? (JSON.parse(p1DeckRaw) as string[]) : [];
    const p2Deck = p2DeckRaw ? (JSON.parse(p2DeckRaw) as string[]) : [];

    // Fetch full participant data
    const [p1, p2] = await Promise.all([
      this.battleService.getParticipant(player1Id, p1Deck),
      this.battleService.getParticipant(player2Id, p2Deck),
    ]);

    const match = await this.prismaService.pvPMatch.create({
      data: {
        player1Id: player1Id,
        player2Id: player2Id,
        player1Deck: p1Deck,
        player2Deck: p2Deck,
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

    // Clean up Redis
    await Promise.all([
      this.redisService.hdel('pvp_decks', player1Id),
      this.redisService.hdel('pvp_decks', player2Id),
    ]);

    return {
      ...match,
      participants: { p1, p2 },
    } as unknown as PvPMatch;
  }
}
