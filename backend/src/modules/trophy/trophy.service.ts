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

    const hasLegendary = cards.some((c) => c.rarity === Rarity.UR || c.rarity === Rarity.LR);

    if (hasLegendary) {
      await this.awardTrophy(playerId, 'LEGENDARY_FINDER', {
        name: 'LEGENDARY_FINDER',
        description: 'Pull a UR or LR card from a pack',
        icon: '🌟',
      });
    }

    // Check collection size
    const count = await this.prisma.inventory.count({ where: { playerId } });
    if (count >= 50) {
      await this.awardTrophy(playerId, 'COLLECTION_EXPERT', {
        name: 'COLLECTION_EXPERT',
        description: 'Maintain a collection of 50+ article cards',
        icon: '📚',
      });
    }

    // Gacha Addiction
    if (cards.length > 0) {
      // Just a simple increment if we had a counter, but let's check pulls via history or just total cards
      if (count >= 100) {
        await this.awardTrophy(playerId, 'GACHA_JUNKIE', {
          name: 'GACHA_JUNKIE',
          description: 'Acquire over 100 cards through the terminal',
          icon: '🎰',
        });
      }
    }
  }

  @OnEvent('battle.won')
  async handleBattleWon(payload: { playerId: string; isWinner: boolean; isPvP?: boolean }) {
    const { playerId, isWinner, isPvP } = payload;
    if (!isWinner) return;

    if (isPvP) {
      await this.awardTrophy(playerId, 'PVP_CONQUEROR', {
        name: 'PVP_CONQUEROR',
        description: 'Achieve victory in your first PvP engagement',
        icon: '⚔️',
      });
    }

    // Count both normal battles and PvP matches where this player won
    const [battleWins, pvpWins, player] = await Promise.all([
      this.prisma.battle.count({
        where: { winnerId: playerId },
      }),
      this.prisma.pvPMatch.count({
        where: { winnerId: playerId },
      }),
      this.prisma.player.findUnique({ where: { id: playerId } }),
    ]);

    const totalWins = battleWins + pvpWins;

    if (totalWins >= 10) {
      await this.awardTrophy(playerId, 'VETERAN_COMMANDER', {
        name: 'VETERAN_COMMANDER',
        description: 'Win 10 battles across all modes',
        icon: '🎖️',
      });
    }

    if (player && player.eloRating >= 1300) {
      await this.awardTrophy(playerId, 'ELITE_DUELIST', {
        name: 'ELITE_DUELIST',
        description: 'Reach an Elo rating of 1300 or higher',
        icon: '🏆',
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
