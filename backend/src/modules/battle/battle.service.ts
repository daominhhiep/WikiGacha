import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BattleEngine, BattleParticipant } from './battle-engine';
import { BattleStatus } from '../../generated/prisma/client';

@Injectable()
export class BattleService {
  private engine: BattleEngine;

  constructor(private prisma: PrismaService) {
    this.engine = new BattleEngine();
  }

  /**
   * Starts an auto-battle for a player against an opponent (AI if no opponentId provided).
   *
   * @param playerId The unique player identifier.
   * @param deckIds Array of card IDs from the player's inventory to use in battle.
   * @param opponentId Optional identifier for a specific opponent player.
   * @returns Battle result including logs and rewards.
   */
  async startBattle(playerId: string, deckIds: string[], opponentId?: string) {
    if (!deckIds || deckIds.length === 0) {
      throw new BadRequestException('BATTLE_DECK_EMPTY: Must select at least one card.');
    }

    if (deckIds.length > 5) {
      throw new BadRequestException('BATTLE_DECK_TOO_LARGE: Maximum of 5 cards allowed.');
    }

    // Fetch player's cards from inventory
    const playerInventory = await this.prisma.inventory.findMany({
      where: {
        playerId,
        cardId: { in: deckIds },
      },
      include: { card: true },
    });

    if (playerInventory.length === 0) {
      throw new NotFoundException('BATTLE_CARDS_NOT_FOUND: Selected cards not found in player inventory.');
    }

    // Map to BattleParticipant for Player 1
    const p1: BattleParticipant = {
      id: playerId,
      cards: playerInventory.map(item => ({
        instanceId: item.id,
        title: item.card.title,
        hp: item.card.hp,
        maxHp: item.card.hp,
        atk: item.card.atk,
        def: item.card.def,
      })),
    };

    let p2: BattleParticipant;

    if (opponentId) {
      // PvP: Fetch opponent's deck (simplified for MVP: just use their first 3 cards if not specified)
      const opponentInventory = await this.prisma.inventory.findMany({
        where: { playerId: opponentId },
        take: p1.cards.length,
        include: { card: true },
      });

      if (opponentInventory.length === 0) {
        throw new NotFoundException('BATTLE_OPPONENT_EMPTY: Opponent has no cards.');
      }

      p2 = {
        id: opponentId,
        cards: opponentInventory.map(item => ({
          instanceId: item.id,
          title: item.card.title,
          hp: item.card.hp,
          maxHp: item.card.hp,
          atk: item.card.atk,
          def: item.card.def,
        })),
      };
    } else {
      // PvE: Generate an AI opponent using random cards from the global pool
      const randomCards = await this.prisma.card.findMany({
        take: p1.cards.length,
        orderBy: { createdAt: 'desc' }, // Simplified random choice
      });

      p2 = {
        id: 'AI_BOT',
        cards: randomCards.map(card => ({
          instanceId: `AI_${card.id}`,
          title: card.title,
          hp: card.hp,
          maxHp: card.hp,
          atk: card.atk,
          def: card.def,
        })),
      };
    }

    // Execute simulation
    const result = this.engine.simulate(p1, p2);

    // Calculate rewards
    const isWinner = result.winnerId === playerId;
    const rewards = {
      credits: isWinner ? 50 : 10,
      xp: isWinner ? 100 : 20,
    };

    // Save Battle Record
    const battle = await this.prisma.battle.create({
      data: {
        player1Id: playerId,
        player2Id: opponentId || null,
        winnerId: isWinner ? playerId : (opponentId || null),
        log: result.log as any,
        status: BattleStatus.COMPLETED,
      },
    });

    // Update Player rewards
    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        credits: { increment: rewards.credits },
        xp: { increment: rewards.xp },
      },
    });

    // Handle level up (Simplified: level = floor(xp/1000) + 1)
    const updatedPlayer = await this.prisma.player.findUnique({ where: { id: playerId } });
    if (updatedPlayer) {
      const newLevel = Math.floor(updatedPlayer.xp / 1000) + 1;
      if (newLevel > updatedPlayer.level) {
        await this.prisma.player.update({
          where: { id: playerId },
          data: { level: newLevel },
        });
      }
    }

    return {
      battleId: battle.id,
      winnerId: result.winnerId,
      log: result.log,
      rewards,
    };
  }

  /**
   * Retrieves battle history for a specific player.
   *
   * @param playerId The unique player identifier.
   * @returns List of past battle records.
   */
  async getBattleHistory(playerId: string) {
    return this.prisma.battle.findMany({
      where: {
        OR: [
          { player1Id: playerId },
          { player2Id: playerId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
    });
  }
}
