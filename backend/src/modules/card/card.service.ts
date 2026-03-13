import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from './../../common/prisma/prisma.service';
import { WikiService, ArticleSummary } from './wiki.service';
import { Rarity, Card, Tier, Category } from '../../generated/prisma/client';
import { RedisService } from '../../common/redis/redis.service';
import { StatBalancer } from './utils/stat-balancer';

/**
 * Service for managing game cards and gacha mechanics.
 * Handles card generation, pack opening, and rarity derivation from Wikipedia metadata.
 */
@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);
  private readonly PACK_COST = 10;
  private readonly CARDS_PER_PACK = 5;
  private readonly PITY_THRESHOLD = 10;
  private readonly CACHE_KEY_COUNT = 'gacha:pool:count';

  constructor(
    private readonly prisma: PrismaService,
    private readonly wikiService: WikiService,
    private readonly redisService: RedisService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Opens a card pack for a player.
   * Pulls from the pre-generated Card Pool for sub-second performance.
   * Triggers a background refill to keep the pool infinite.
   */
  async openPack(playerId: string) {
    const startTime = Date.now();

    // 1. Check player state
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) throw new BadRequestException('Player not found');
    if (player.credits < this.PACK_COST) throw new BadRequestException('Insufficient credits');

    // 2. Get total cards (from Cache or DB)
    let totalCards: number;
    try {
      const cachedCount = await this.redisService.get(this.CACHE_KEY_COUNT);
      if (cachedCount) {
        totalCards = parseInt(cachedCount, 10);
      } else {
        totalCards = await this.prisma.card.count();
        // If pool is large enough (>= 50k), cache for 24 hours, otherwise 1 min
        const ttl = totalCards >= 50000 ? 86400 : 60;
        await this.redisService.set(this.CACHE_KEY_COUNT, totalCards.toString(), 'EX', ttl);
      }
    } catch (err) {
      this.logger.warn(`Redis error fetching card count: ${err.message}`);
      totalCards = await this.prisma.card.count();
    }

    // 3. Pull 5 random cards from the local Card Pool
    let cards: Card[] = [];

    if (totalCards >= this.CARDS_PER_PACK) {
      // Pick random cards using skip (more efficient than ORDER BY RAND for Prisma)
      const randomIndices = new Set<number>();
      while (randomIndices.size < this.CARDS_PER_PACK) {
        randomIndices.add(Math.floor(Math.random() * totalCards));
      }

      const cardPromises = Array.from(randomIndices).map((index) =>
        this.prisma.card.findMany({
          take: 1,
          skip: index,
        }),
      );
      const results = await Promise.all(cardPromises);
      cards = results.map((r) => r[0]);
    }

    // Fallback if DB is empty or selection failed
    if (cards.length < this.CARDS_PER_PACK) {
      this.logger.warn(`Card pool is low (${totalCards}), performing emergency live fetch`);
      const titles = await this.wikiService.getRandomArticles(this.CARDS_PER_PACK);
      const batchData = await this.wikiService.getBatchArticlesData(titles);

      const liveCards = await Promise.all(
        titles.map(async (title) => {
          const data = batchData[title];
          if (!data) return null;
          const wikiRank = await this.wikiService.getWikiRankScore(title);
          return this.generateCardFromWiki(
            data,
            data.pageViews * 12,
            data.languageCount,
            data.pageAssessments,
            data.length,
            wikiRank.quality,
            wikiRank.popularity,
          );
        }),
      );
      cards = liveCards.filter((c): c is Card => c !== null);
    }

    // 4. Pity Logic: If pity is triggered and no high rarity in the 5 cards, replace one
    const currentPity = player.pityCounter + 1;
    let highRarityPulled = cards.some(
      (c) => c.rarity === Rarity.SSR || c.rarity === Rarity.UR || c.rarity === Rarity.LR,
    );

    if (currentPity >= this.PITY_THRESHOLD && !highRarityPulled) {
      const highRarityCards = await this.prisma.card.findMany({
        where: { rarity: { in: [Rarity.SSR, Rarity.UR, Rarity.LR] } },
        take: 1,
      });

      if (highRarityCards.length > 0) {
        cards[this.CARDS_PER_PACK - 1] = highRarityCards[0];
        highRarityPulled = true;
      } else {
        this.logger.warn(
          'Pity triggered but no high rarity cards in pool! User will get a normal card but pity will NOT reset.',
        );
      }
    }

    // 5. Update Inventory and Player State in parallel
    const [updatedPlayer] = await Promise.all([
      this.prisma.player.update({
        where: { id: playerId },
        data: {
          credits: { decrement: this.PACK_COST },
          pityCounter: highRarityPulled ? 0 : currentPity,
        },
      }),
      this.prisma.inventory.createMany({
        data: cards.map((card) => ({
          playerId,
          cardId: card.id,
        })),
      }),
    ]);

    this.eventEmitter.emit('card.pulled', { playerId, count: cards.length, cards });

    // 6. BACKGROUND REFILL: Keep pool fresh (Fire and forget)
    // Grow the pool until it reaches 50000 cards
    if (totalCards < 50000) {
      this.logger.log(`[Background] Triggering pool refill (Current size: ${totalCards})`);
      this.refillPool(15).catch((err) => this.logger.error(`Pool refill failed: ${err.message}`));
    }

    const duration = Date.now() - startTime;
    this.logger.log(`Pack opened for ${playerId} in ${duration}ms. Pool size: ${totalCards}`);

    return {
      newCards: cards,
      remainingCredits: updatedPlayer.credits,
      pityCounter: updatedPlayer.pityCounter,
    };
  }

  /**
   * Refills the card pool in the background.
   */
  async refillPool(count: number = 10) {
    this.logger.log(`[Background] Refilling card pool with ${count} new articles...`);
    const titles = await this.wikiService.getRandomArticles(count);
    const batchData = await this.wikiService.getBatchArticlesData(titles);

    const promises = titles.map(async (title) => {
      try {
        const data = batchData[title];
        if (!data) return;
        const wikiRank = await this.wikiService.getWikiRankScore(title);
        await this.generateCardFromWiki(
          data,
          data.pageViews * 12,
          data.languageCount,
          data.pageAssessments,
          data.length,
          wikiRank.quality,
          wikiRank.popularity,
        );
      } catch (e) {
        this.logger.error(`Failed to generate pool card for ${title}: ${e.message}`);
      }
    });

    await Promise.all(promises);
    this.logger.log(`[Background] Refill complete.`);

    // Update cached count after refill
    try {
      const totalCards = await this.prisma.card.count();
      const ttl = totalCards >= 50000 ? 86400 : 60;
      await this.redisService.set(this.CACHE_KEY_COUNT, totalCards.toString(), 'EX', ttl);
    } catch (e) {
      this.logger.warn(`Failed to update cached card count: ${e.message}`);
    }
  }

  /**
   * Generates a game card from a Wikipedia article summary.
   */
  async generateCardFromWiki(
    wikiData: ArticleSummary,
    pageViews: number = 0,
    languageCount: number = 0,
    pageAssessments?: Record<string, string>,
    length: number = 0,
    quality: number = 0,
    popularity: number = 0,
  ): Promise<Card> {
    const start = Date.now();
    // 1. Determine final Q-Score (WikiRank preferred, fallback to internal calculation)
    let finalQScore = quality;
    if (finalQScore <= 0) {
      finalQScore = this.calculateQScore(pageAssessments, length, languageCount);
    }

    const rarity = this.deriveRarity(finalQScore);
    const stats = StatBalancer.deriveStats(pageViews, length, languageCount, rarity);
    const tier = StatBalancer.getTier(rarity);
    const category = StatBalancer.deriveCategory(wikiData.title, wikiData.extract);

    const cardData = {
      id: wikiData.pageid.toString(),
      title: wikiData.title,
      summary: wikiData.extract,
      imageUrl: wikiData.thumbnail,
      wikiUrl:
        wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${wikiData.title}`,
      rarity,
      tier,
      category,
      hp: stats.hp,
      atk: stats.atk,
      def: stats.def,
      pageViews,
      languageCount,
      quality,
      popularity,
    };

    // Upsert the card in the database to ensure we have the latest version but don't duplicate
    const card = await this.prisma.card.upsert({
      where: { id: cardData.id },
      update: cardData,
      create: cardData,
    });

    const duration = Date.now() - start;
    this.logger.debug(`generateCardFromWiki("${wikiData.title}") took ${duration}ms`);
    return card;
  }

  /**
   * Calculates a Quality Score (0-100) based on Wikipedia assessments and metadata.
   */
  private calculateQScore(
    pageAssessments?: Record<string, string>,
    length: number = 0,
    languageCount: number = 0,
  ): number {
    this.logger.debug(
      `Calculating Q-Score fallback: length=${length}, languageCount=${languageCount}, assessments=${JSON.stringify(pageAssessments)}`,
    );
    // 1. Map assessments to base scores
    const assessmentScores: Record<string, number> = {
      FA: 100, // LR
      GA: 90, // UR
      B: 80, // SSR
      C: 60, // SR
      Start: 35, // R
      Stub: 20, // UC
    };

    if (pageAssessments) {
      const values = Object.values(pageAssessments);
      const scores = values.map((v) => assessmentScores[v] || 0).filter((s) => s > 0);
      if (scores.length > 0) {
        const bestScore = Math.max(...scores);
        this.logger.debug(`Found highest assessment score: ${bestScore}`);
        return bestScore;
      }
    }

    // 2. Synthetic fallback if no assessment found
    // Scale length (logarithmic): ~100k length -> 70 points
    const lengthScore = Math.min(Math.log10(Math.max(1, length)) * 15, 70);
    // Scale language count: ~50 languages -> 30 points
    const langScore = Math.min(languageCount * 0.6, 30);

    const finalScore = Math.floor(lengthScore + langScore);
    this.logger.debug(`Synthetic Q-Score result: ${finalScore}`);
    return finalScore;
  }

  /**
   * Derives rarity based on Q-Score.
   */
  private deriveRarity(qScore: number): Rarity {
    if (qScore >= 100) return Rarity.LR;
    if (qScore >= 90) return Rarity.UR;
    if (qScore >= 80) return Rarity.SSR;
    if (qScore >= 60) return Rarity.SR;
    if (qScore >= 35) return Rarity.R;
    if (qScore >= 20) return Rarity.UC;
    return Rarity.C;
  }
}
