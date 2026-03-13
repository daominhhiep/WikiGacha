import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from './../../common/prisma/prisma.service';
import { WikiService, ArticleSummary } from './wiki.service';
import { Rarity, Card } from '../../generated/prisma/client';

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

  // Cache for global stats to avoid frequent API calls
  private cachedAverageViews: number | null = null;
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly wikiService: WikiService,
  ) {}

  /**
   * Calculates the average pageviews per article across the entire wiki.
   * This provides a baseline for dynamic rarity thresholds.
   */
  private async getAverageViews(): Promise<number> {
    const now = Date.now();
    if (this.cachedAverageViews && now - this.lastCacheUpdate < this.CACHE_TTL) {
      return this.cachedAverageViews;
    }

    try {
      const stats = await this.wikiService.getGlobalStats();
      const average = stats.totalMonthlyViews / Math.max(1, stats.articleCount);
      this.cachedAverageViews = average;
      this.lastCacheUpdate = now;
      this.logger.log(`[Calibration] Global Average Pageviews: ${average.toFixed(2)}`);
      return average;
    } catch (error) {
      this.logger.warn(`Failed to fetch global stats, using fallback average: ${error.message}`);
      return 1500; // Fallback based on ~10B monthly views / 7M articles
    }
  }

  /**
   * Opens a card pack for a player.
   * Deducts credits, fetches articles, generates cards, and adds to inventory.
   * Includes a pity system: Guaranteed S or higher every 10 packs.
   *
   * @param playerId The unique identifier of the player opening the pack.
   * @throws BadRequestException if the player is not found or has insufficient credits.
   * @returns An object containing the generated cards and the player's remaining credits.
   */
  async openPack(playerId: string) {
    // 1. Check player state
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new BadRequestException('Player not found');
    }

    if (player.credits < this.PACK_COST) {
      throw new BadRequestException('Insufficient credits');
    }

    // 2. Fetch random article titles
    const titles = await this.wikiService.getRandomArticles(this.CARDS_PER_PACK);

    // 3. Fetch summaries and generate cards
    const newCards: Card[] = [];
    let highRarityPulled = false;
    const currentPity = player.pityCounter + 1;
    const isPityTriggered = currentPity >= this.PITY_THRESHOLD;

    for (let i = 0; i < titles.length; i++) {
      const title = titles[i];
      const wikiData = await this.wikiService.getArticleSummary(title);

      if (wikiData) {
        // Fetch real stats from Wikipedia
        const wikiStats = await this.wikiService.getArticleStats(title);
        let pageViews = wikiStats.pageViews;
        const languageCount = wikiStats.languageCount;

        // Pity Logic: If this is the last card and no S+ pulled yet, force high rarity
        const isLastCard = i === titles.length - 1;
        if (isLastCard && isPityTriggered && !highRarityPulled) {
          this.logger.log(`[Pity Triggered] Forcing S+ for player ${playerId}`);
          const averageViews = await this.getAverageViews();
          // Force page views to at least S threshold (avg * 50)
          const minPityViews = Math.ceil(averageViews * 50);
          pageViews = Math.max(pageViews, minPityViews + Math.floor(Math.random() * averageViews * 500));
        }

        const card = await this.generateCardFromWiki(wikiData, pageViews, languageCount);
        newCards.push(card);

        // Track if we pulled an S or higher (S, SR, or SSR)
        if (card.rarity === Rarity.S || card.rarity === Rarity.SR || card.rarity === Rarity.SSR) {
          highRarityPulled = true;
        }

        // Add to player inventory
        await this.prisma.inventory.create({
          data: {
            playerId,
            cardId: card.id,
          },
        });
      }
    }

    this.logger.log(`[Pity Debug] Player ${playerId} before update: credits=${player.credits}, pityCounter=${player.pityCounter}`);
    this.logger.log(`[Pity Debug] Result of pull: highRarityPulled=${highRarityPulled}, newPity=${highRarityPulled ? 0 : currentPity}`);

    // 4. Update player state: Deduct credits and update pity counter
    const updatedPlayer = await this.prisma.player.update({
      where: { id: playerId },
      data: {
        credits: {
          decrement: this.PACK_COST,
        },
        // Reset pity if S or higher was pulled, otherwise increment
        pityCounter: highRarityPulled ? 0 : currentPity,
      },
    });

    this.logger.log(`[Pity Debug] Player ${playerId} after update: credits=${updatedPlayer.credits}, pityCounter=${updatedPlayer.pityCounter}`);

    return {
      newCards,
      remainingCredits: updatedPlayer.credits,
      pityCounter: updatedPlayer.pityCounter,
    };
  }

  /**
   * Generates a game card from a Wikipedia article summary.
   *
   * @param wikiData Summary data from Wikipedia API.
   * @param pageViews (Optional) Page views for rarity/stat derivation.
   * @param languageCount (Optional) Number of languages for HP derivation.
   * @returns The newly created or updated card from the database.
   */
  async generateCardFromWiki(
    wikiData: ArticleSummary,
    pageViews: number = 0,
    languageCount: number = 0,
  ): Promise<Card> {
    const averageViews = await this.getAverageViews();
    const rarity = this.deriveRarity(pageViews, averageViews);
    const stats = this.deriveStats(wikiData, pageViews, languageCount);

    const cardData = {
      id: wikiData.pageid.toString(),
      title: wikiData.title,
      summary: wikiData.extract,
      imageUrl: wikiData.thumbnail,
      wikiUrl:
        wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${wikiData.title}`,
      rarity,
      hp: stats.hp,
      atk: stats.atk,
      def: stats.def,
      pageViews,
      languageCount,
    };

    // Upsert the card in the database to ensure we have the latest version but don't duplicate
    return this.prisma.card.upsert({
      where: { id: cardData.id },
      update: cardData,
      create: cardData,
    });
  }

  /**
   * Derives rarity based on page views relative to the global average.
   *
   * @param pageViews The number of views for the Wikipedia article.
   * @param avg The global average pageviews per article.
   * @returns The derived Rarity level (N, R, S, SR, SSR).
   */
  private deriveRarity(pageViews: number, avg: number): Rarity {
    // Thresholds scaled by average views (calibration)
    // S and SR thresholds increased to reduce their frequency
    if (pageViews >= avg * 500) return Rarity.SSR; // ~750,000+
    if (pageViews >= avg * 150) return Rarity.SR;  // ~225,000+
    if (pageViews >= avg * 50) return Rarity.S;    // ~75,000+
    if (pageViews >= avg * 10) return Rarity.R;    // ~15,000+
    return Rarity.N;
  }

  /**
   * Derives game stats from Wikipedia metrics.
   * Formula logic:
   * - HP: Based on Language Count (Breadth of knowledge)
   * - ATK: Based on Page Views (Impact/Popularity)
   * - DEF: Based on Article Length/Summary complexity (Depth)
   *
   * @param wikiData The summary data from Wikipedia.
   * @param pageViews The popularity of the article.
   * @param languageCount The number of languages the article is available in.
   * @returns An object containing the derived HP, ATK, and DEF stats.
   */
  private deriveStats(wikiData: ArticleSummary, pageViews: number, languageCount: number) {
    // Base stats
    const baseHp = 50;
    const baseAtk = 10;
    const baseDef = 10;

    // HP scales with language count (logarithmic to prevent outliers)
    const hpBonus = Math.floor(Math.log2(Math.max(1, languageCount)) * 15);

    // ATK scales with popularity (logarithmic)
    const atkBonus = Math.floor(Math.log10(Math.max(1, pageViews)) * 10);

    // DEF scales with summary length (proxy for depth)
    const summaryLength = wikiData.extract?.length || 0;
    const defBonus = Math.floor(Math.min(summaryLength / 20, 50));

    return {
      hp: baseHp + hpBonus,
      atk: baseAtk + atkBonus,
      def: baseDef + defBonus,
    };
  }
}
