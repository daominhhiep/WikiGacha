import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BattleEngine, BattleParticipant, BattleLogEntry } from './battle-engine';
import { BattleStatus, Card } from '../../generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface EloUpdate {
  player1: { old: number; new: number };
  player2: { old: number; new: number };
}

@Injectable()
export class BattleService {
  private engine: BattleEngine;

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {
    this.engine = new BattleEngine();
  }

  /**
   * Fetches player's cards from inventory and maps them to a BattleParticipant.
   */
  async getParticipant(playerId: string, deckIds: string[]): Promise<BattleParticipant> {
    const playerInventory = await this.prisma.inventory.findMany({
      where: {
        playerId,
        id: { in: deckIds },
      },
      include: { card: true },
    });

    if (playerInventory.length === 0) {
      throw new NotFoundException('BATTLE_CARDS_NOT_FOUND: Selected cards not found.');
    }

    return {
      id: playerId,
      cards: playerInventory.map((item) => ({
        instanceId: item.id,
        title: item.card.title,
        imageUrl: item.card.imageUrl || undefined,
        rarity: item.card.rarity,
        hp: item.card.hp,
        maxHp: item.card.hp,
        atk: item.card.atk,
        def: item.card.def,
      })),
    };
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

    // Map to BattleParticipant for Player 1
    const p1 = await this.getParticipant(playerId, deckIds);

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
        cards: opponentInventory.map((item) => ({
          instanceId: item.id,
          title: item.card.title,
          imageUrl: item.card.imageUrl || undefined,
          rarity: item.card.rarity,
          hp: item.card.hp,
          maxHp: item.card.hp,
          atk: item.card.atk,
          def: item.card.def,
        })),
      };
    } else {
      // PvE: Generate an AI opponent using random cards from the global pool
      const totalCards = await this.prisma.card.count();
      const numCards = Math.min(p1.cards.length, 5);
      const randomCards: Card[] = [];

      if (totalCards > 0) {
        const randomIndices = new Set<number>();
        while (randomIndices.size < Math.min(numCards, totalCards)) {
          randomIndices.add(Math.floor(Math.random() * totalCards));
        }

        const cardPromises = Array.from(randomIndices).map((index) =>
          this.prisma.card.findFirst({
            skip: index,
          }),
        );
        const results = await Promise.all(cardPromises);
        randomCards.push(...results.filter((c): c is Card => c !== null));
      }

      p2 = {
        id: 'AI_BOT',
        cards: randomCards.map((card) => ({
          instanceId: `AI_${card.id}`,
          title: card.title,
          imageUrl: card.imageUrl || undefined,
          rarity: card.rarity,
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

    // Calculate Elo for PvP
    let eloUpdate: EloUpdate | null = null;
    if (opponentId) {
      const [player1, player2] = await Promise.all([
        this.prisma.player.findUnique({ where: { id: playerId } }),
        this.prisma.player.findUnique({ where: { id: opponentId } }),
      ]);

      if (player1 && player2) {
        let outcome = 0.5; // Draw
        if (result.winnerId === playerId) outcome = 1;
        else if (result.winnerId === opponentId) outcome = 0;

        const { player1NewElo, player2NewElo } = this.calculateElo(
          player1.eloRating,
          player2.eloRating,
          outcome,
        );

        // Update player 2 Elo and matchesPlayed
        await this.prisma.player.update({
          where: { id: opponentId },
          data: {
            eloRating: player2NewElo,
            matchesPlayed: { increment: 1 },
          },
        });

        eloUpdate = {
          player1: { old: player1.eloRating, new: player1NewElo },
          player2: { old: player2.eloRating, new: player2NewElo },
        };
      }
    }

    // Save Battle Record
    const battle = await this.prisma.battle.create({
      data: {
        player1Id: playerId,
        player2Id: opponentId || null,
        winnerId: isWinner
          ? playerId
          : opponentId && result.winnerId === opponentId
            ? opponentId
            : null,
        log: result.log as any,
        player1Deck: deckIds,
        player2Deck: opponentId
          ? p2.cards.map((c) => c.instanceId)
          : p2.cards.map((c) => c.instanceId.replace('AI_', '')),
        status: BattleStatus.COMPLETED,
      },
    });

    this.eventEmitter.emit('battle.won', {
      playerId,
      winnerId: result.winnerId,
      isWinner: result.winnerId === playerId,
    });

    // Update Player 1 rewards and Elo
    await this.prisma.player.update({
      where: { id: playerId },
      data: {
        credits: { increment: rewards.credits },
        xp: { increment: rewards.xp },
        ...(eloUpdate
          ? {
              eloRating: eloUpdate.player1.new,
              matchesPlayed: { increment: 1 },
            }
          : {}),
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

    // Emit event for mission tracking
    this.eventEmitter.emit('battle.finished', {
      playerId,
      isWinner,
      opponentId: opponentId || 'AI_BOT',
    });

    return {
      battleId: battle.id,
      winnerId: result.winnerId,
      participants: result.participants,
      log: result.log,
      rewards,
      elo: eloUpdate,
    };
  }

  /**
   * Calculates new Elo ratings for two players.
   *
   * @param player1Elo Current Elo of player 1.
   * @param player2Elo Current Elo of player 2.
   * @param outcome 1 for player 1 win, 0.5 for draw, 0 for player 1 loss.
   * @returns New Elo ratings for both players.
   */
  calculateElo(player1Elo: number, player2Elo: number, outcome: number) {
    const K = 32;
    const expected1 = 1 / (1 + Math.pow(10, (player2Elo - player1Elo) / 400));
    const expected2 = 1 / (1 + Math.pow(10, (player1Elo - player2Elo) / 400));

    const player1NewElo = Math.round(player1Elo + K * (outcome - expected1));
    const player2NewElo = Math.round(player2Elo + K * (1 - outcome - expected2));

    return { player1NewElo, player2NewElo };
  }

  /**
   * Retrieves battle history (both PvE and PvP) for a specific player.
   *
   * @param playerId The unique player identifier.
   * @returns List of past battle records from both Battle and PvPMatch tables.
   */
  async getBattleHistory(playerId: string) {
    const [pveBattles, pvpMatches] = await Promise.all([
      this.prisma.battle.findMany({
        where: {
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
        },
        orderBy: { createdAt: 'desc' },
        include: {
          player1: { select: { id: true, username: true, avatarUrl: true } },
          player2: { select: { id: true, username: true, avatarUrl: true } },
          winner: { select: { id: true, username: true } },
        },
      }),
      this.prisma.pvPMatch.findMany({
        where: {
          OR: [{ player1Id: playerId }, { player2Id: playerId }],
          status: 'COMPLETED',
        },
        orderBy: { createdAt: 'desc' },
        include: {
          player1: { select: { id: true, username: true, avatarUrl: true } },
          player2: { select: { id: true, username: true, avatarUrl: true } },
          winner: { select: { id: true, username: true } },
        },
      }),
    ]);

    // Merge and sort
    const history = [
      ...pveBattles.map((b) => ({ ...b, type: 'PVE' })),
      ...pvpMatches.map((m) => ({ ...m, type: 'PVP' })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return history;
  }

  /**
   * Retrieves a single battle by ID, ensuring the player was a participant.
   */
  async getBattle(id: string, playerId: string) {
    const battle = await this.prisma.battle.findUnique({
      where: { id },
      include: {
        player1: { select: { id: true, username: true, avatarUrl: true } },
        player2: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    if (!battle) {
      throw new NotFoundException('Battle not found');
    }

    if (battle.player1Id !== playerId && battle.player2Id && battle.player2Id !== playerId) {
      throw new NotFoundException('UNAUTHORIZED: You were not a participant in this battle.');
    }

    // Reconstruct participants
    const p1Deck = (battle.player1Deck as string[]) || [];
    const p2Deck = (battle.player2Deck as string[]) || [];

    const p1: BattleParticipant & { username?: string; avatarUrl?: string | null } =
      await this.getParticipant(battle.player1Id, p1Deck);
    if (battle.player1) {
      p1.username = battle.player1.username;
      p1.avatarUrl = battle.player1.avatarUrl;
    }

    let p2: BattleParticipant & { username?: string; avatarUrl?: string | null };
    if (battle.player2Id) {
      p2 = await this.getParticipant(battle.player2Id, p2Deck);
      if (battle.player2) {
        p2.username = battle.player2.username;
        p2.avatarUrl = battle.player2.avatarUrl;
      }
    } else {
      // Reconstruct AI
      const aiCards = await this.prisma.card.findMany({
        where: { id: { in: p2Deck } },
      });

      p2 = {
        id: 'AI_BOT',
        username: 'AI_BOT',
        cards: aiCards.map((card) => ({
          instanceId: `AI_${card.id}`,
          title: card.title,
          imageUrl: card.imageUrl || undefined,
          rarity: card.rarity,
          hp: card.hp,
          maxHp: card.hp,
          atk: card.atk,
          def: card.def,
        })),
      };
    }

    return {
      id: battle.id,
      battleId: battle.id,
      winnerId: battle.winnerId,
      participants: { p1, p2 },
      log: (battle.log as unknown as BattleLogEntry[]) || [],
      rewards: { credits: 50, xp: 100 }, // Default rewards
      status: battle.status,
    };
  }
}
