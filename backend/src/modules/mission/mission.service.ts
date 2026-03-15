import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class MissionService {
  private readonly logger = new Logger(MissionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Resets all DAILY missions for all players every day at midnight UTC.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyMissions() {
    this.logger.log('Starting daily mission reset...');

    try {
      // updateMany does not support relation filtering in some Prisma versions.
      // We first find all daily mission IDs.
      const dailyMissions = await this.prisma.mission.findMany({
        where: { type: 'DAILY' },
        select: { id: true },
      });

      const dailyMissionIds = dailyMissions.map((m) => m.id);

      if (dailyMissionIds.length === 0) {
        this.logger.warn('No daily missions found to reset.');
        return;
      }

      const result = await this.prisma.userMission.updateMany({
        where: {
          missionId: { in: dailyMissionIds },
        },
        data: {
          progress: 0,
          isCompleted: false,
          isClaimed: false,
        },
      });

      this.logger.log(`Successfully reset daily missions for all players. Affected: ${result.count}`);
    } catch (error) {
      this.logger.error('Failed to reset daily missions', error.stack);
    }
  }

  /**
   * Listens for 'card.pulled' event and updates mission progress.
   */
  @OnEvent('card.pulled')
  async handleCardPulled(payload: { playerId: string; count: number }) {
    this.logger.debug(
      `Handling card.pulled for player ${payload.playerId}, count: ${payload.count}`,
    );
    await this.updateProgress(payload.playerId, 'PULL_CARDS', payload.count);
  }

  /**
   * Listens for 'battle.finished' event and updates mission progress.
   */
  @OnEvent('battle.finished')
  async handleBattleFinished(payload: { playerId: string; isWinner: boolean }) {
    this.logger.debug(
      `Handling battle.finished for player ${payload.playerId}, isWinner: ${payload.isWinner}`,
    );
    // Increment 'PLAY_BATTLES'
    await this.updateProgress(payload.playerId, 'PLAY_BATTLES', 1);

    // Increment 'WIN_BATTLES' if winner
    if (payload.isWinner) {
      await this.updateProgress(payload.playerId, 'WIN_BATTLES', 1);
    }
  }

  /**
   * Core logic to update progress for all active missions of a specific type.
   */
  private async updateProgress(playerId: string, type: string, amount: number) {
    // 1. Find all active (not completed) UserMissions for this player
    const userMissions = await this.prisma.userMission.findMany({
      where: {
        playerId,
        isCompleted: false,
      },
      include: { mission: true },
    });

    // 2. Filter by criteria type and update progress
    for (const userMission of userMissions) {
      const criteria = userMission.mission.criteria as any;

      if (criteria && criteria.type === type) {
        const targetCount = criteria.count || 0;
        const newProgress = Math.min(userMission.progress + amount, targetCount);
        const isCompleted = newProgress >= targetCount;

        await this.prisma.userMission.update({
          where: { id: userMission.id },
          data: {
            progress: newProgress,
            isCompleted,
          },
        });

        if (isCompleted) {
          this.logger.log(`Mission [${userMission.mission.title}] COMPLETED by player ${playerId}`);
        }
      }
    }
  }

  /**
   * Claims reward for a completed mission.
   */
  async claimReward(playerId: string, userMissionId: number) {
    const userMission = await this.prisma.userMission.findUnique({
      where: { id: userMissionId },
      include: { mission: true },
    });

    if (!userMission || userMission.playerId !== playerId) {
      throw new NotFoundException('Mission not found for this player.');
    }

    if (!userMission.isCompleted) {
      throw new BadRequestException('Mission is not completed yet.');
    }

    if (userMission.isClaimed) {
      throw new BadRequestException('Reward already claimed.');
    }

    // Atomically claim reward and update player credits
    return await this.prisma.$transaction(async (tx) => {
      await tx.userMission.update({
        where: { id: userMissionId },
        data: { isClaimed: true },
      });

      const updatedPlayer = await tx.player.update({
        where: { id: playerId },
        data: {
          credits: { increment: userMission.mission.rewardCredits },
        },
      });

      this.logger.log(
        `Player ${playerId} claimed ${userMission.mission.rewardCredits} credits from mission [${userMission.mission.title}]`,
      );

      return {
        success: true,
        rewardCredits: userMission.mission.rewardCredits,
        totalCredits: updatedPlayer.credits,
      };
    });
  }

  /**
   * Helper to fetch all missions for a player.
   */
  async getPlayerMissions(playerId: string) {
    return this.prisma.userMission.findMany({
      where: { playerId },
      include: { mission: true },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Fetches all available missions in the game.
   */
  async getMissions() {
    return this.prisma.mission.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Assigns all currently available missions to a new player.
   */
  async assignInitialMissions(playerId: string) {
    const missions = await this.prisma.mission.findMany();

    for (const mission of missions) {
      // Check if already assigned (to avoid duplicates if called multiple times)
      const existing = await this.prisma.userMission.findFirst({
        where: { playerId, missionId: mission.id },
      });

      if (!existing) {
        await this.prisma.userMission.create({
          data: {
            playerId,
            missionId: mission.id,
            progress: 0,
            isCompleted: false,
            isClaimed: false,
          },
        });
      }
    }
  }
}
