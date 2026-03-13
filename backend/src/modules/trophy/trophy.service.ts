import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Rarity } from '../../generated/prisma/client';

@Injectable()
export class TrophyService {
  private readonly logger = new Logger(TrophyService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('card.pulled')
  async handleCardPulled(payload: { playerId: string; cards: any[] }) {
    const { playerId, cards } = payload;
    if (!cards) return;

    const hasLegendary = cards.some(
      (c) => c.rarity === Rarity.UR || c.rarity === Rarity.LR,
    );

    if (hasLegendary) {
      await this.awardTrophy(playerId, 'LEGENDARY_FINDER', {
        name: 'LEGENDARY_FINDER',
        description: 'Pull a UR or LR card from a pack',
        icon: '🌟',
      });
    }
  }

  @OnEvent('battle.won')
  async handleBattleWon(payload: { playerId: string; isWinner: boolean }) {
    const { playerId, isWinner } = payload;
    if (!isWinner) return;

    // Count both normal battles and PvP matches where this player won
    const [battleWins, pvpWins] = await Promise.all([
      this.prisma.battle.count({
        where: { winnerId: playerId },
      }),
      this.prisma.pvPMatch.count({
        where: { winnerId: playerId },
      }),
    ]);

    const totalWins = battleWins + pvpWins;

    if (totalWins >= 10) {
      await this.awardTrophy(playerId, 'VETERAN_COMMANDER', {
        name: 'VETERAN_COMMANDER',
        description: 'Win 10 battles',
        icon: '🎖️',
      });
    }
  }

  private async awardTrophy(
    playerId: string,
    trophyKey: string,
    details: { name: string; description: string; icon: string },
  ) {
    const existing = await this.prisma.trophy.findFirst({
      where: { playerId, name: details.name },
    });

    if (existing) return;

    await this.prisma.trophy.create({
      data: {
        playerId,
        name: details.name,
        description: details.description,
        icon: details.icon,
      },
    });
    this.logger.log(`Trophy awarded to ${playerId}: ${details.name}`);
  }

  async findUserTrophies(playerId: string) {
    return this.prisma.trophy.findMany({
      where: { playerId },
      orderBy: { unlockedAt: 'desc' },
    });
  }
}
