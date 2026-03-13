import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';

interface MissionCriteria {
  type: string;
  count: number;
}

@Injectable()
export class MissionService {
  private readonly logger = new Logger(MissionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Listen for 'card.pulled' event.
   * Event data: { playerId: string, count: number }
   */
  @OnEvent('card.pulled')
  async handleCardPulled(payload: { playerId: string; count: number }) {
    this.logger.debug(
      `Handling card.pulled for player ${payload.playerId}, count: ${payload.count}`,
    );

    const activeMissions = await this.prisma.userMission.findMany({
      where: {
        playerId: payload.playerId,
        isCompleted: false,
      },
      include: { mission: true },
    });

    for (const userMission of activeMissions) {
      const criteria = userMission.mission.criteria as unknown as MissionCriteria;
      if (criteria && criteria.type === 'PULL_CARDS') {
        const targetCount = criteria.count || 0;
        const newProgress = userMission.progress + payload.count;
        const isCompleted = newProgress >= targetCount;

        await this.prisma.userMission.update({
          where: { id: userMission.id },
          data: {
            progress: newProgress,
            isCompleted,
          },
        });

        if (isCompleted) {
          this.logger.log(
            `Mission [${userMission.mission.title}] COMPLETED by player ${payload.playerId}`,
          );
        }
      }
    }
  }

  /**
   * Listen for 'battle.won' event.
   * Event data: { playerId: string, isWinner: boolean }
   */
  @OnEvent('battle.won')
  async handleBattleWon(payload: { playerId: string; isWinner: boolean }) {
    if (!payload.isWinner) return;

    this.logger.debug(`Handling battle.won for player ${payload.playerId}`);

    const activeMissions = await this.prisma.userMission.findMany({
      where: {
        playerId: payload.playerId,
        isCompleted: false,
      },
      include: { mission: true },
    });

    for (const userMission of activeMissions) {
      const criteria = userMission.mission.criteria as unknown as MissionCriteria;
      if (criteria && criteria.type === 'WIN_BATTLES') {
        const targetCount = criteria.count || 0;
        const newProgress = userMission.progress + 1;
        const isCompleted = newProgress >= targetCount;

        await this.prisma.userMission.update({
          where: { id: userMission.id },
          data: {
            progress: newProgress,
            isCompleted,
          },
        });

        if (isCompleted) {
          this.logger.log(
            `Mission [${userMission.mission.title}] COMPLETED by player ${payload.playerId}`,
          );
        }
      }
    }
  }

  /**
   * Find active UserMissions for player.
   */
  async findUserMissions(playerId: string) {
    return this.prisma.userMission.findMany({
      where: { playerId },
      include: { mission: true },
      orderBy: { id: 'asc' },
    });
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
}
