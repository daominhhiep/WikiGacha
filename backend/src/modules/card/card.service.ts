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

  constructor(
    private readonly prisma: PrismaService,
    private readonly wikiService: WikiService,
  ) {}

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
        // Natural range increased to allow S and SR naturally (up to 500,000)
        let mockPageViews = Math.floor(Math.random() * 500000);
        const mockLangCount = Math.floor(Math.random() * 50);

        // Pity Logic: If this is the last card and no S+ pulled yet, force high rarity
        const isLastCard = i === titles.length - 1;
        if (isLastCard && isPityTriggered && !highRarityPulled) {
          this.logger.log(`[Pity Triggered] Forcing S+ for player ${playerId}`);
          // Force page views to S threshold (> 50,000)
          mockPageViews = 50001 + Math.floor(Math.random() * 950000);
        }

        const card = await this.generateCardFromWiki(wikiData, mockPageViews, mockLangCount);
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
    const rarity = this.deriveRarity(pageViews);
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
   * Derives rarity based on page views.
   * Page views act as a proxy for article popularity/importance.
   *
   * @param pageViews The number of views for the Wikipedia article.
   * @returns The derived Rarity level (N, R, S, SR, SSR).
   */
  private deriveRarity(pageViews: number): Rarity {
    if (pageViews > 500000) return Rarity.SSR;
    if (pageViews > 150000) return Rarity.SR;
    if (pageViews > 50000) return Rarity.S;
    if (pageViews > 15000) return Rarity.R;
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
