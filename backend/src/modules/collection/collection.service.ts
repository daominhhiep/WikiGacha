import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetches all cards in a player's inventory.
   *
   * @param playerId The unique player identifier.
   * @returns List of inventory records including card metadata.
   */
  async getPlayerCollection(playerId: string) {
    return this.prisma.inventory.findMany({
      where: { playerId },
      include: {
        card: true,
      },
      orderBy: {
        acquiredAt: 'desc',
      },
    });
  }

  /**
   * Fetches details for a specific card in a player's collection.
   *
   * @param playerId The unique player identifier.
   * @param cardId The unique card/Wikipedia ID.
   * @returns Detailed card record.
   */
  async getCardInCollection(playerId: string, cardId: string) {
    const item = await this.prisma.inventory.findFirst({
      where: { playerId, cardId },
      include: {
        card: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`CARD_NOT_IN_COLLECTION: Card ${cardId} not found in inventory.`);
    }

    return item;
  }

  /**
   * Toggles the favorite status of an inventory item.
   *
   * @param playerId The unique player identifier.
   * @param inventoryId The unique inventory record ID.
   * @returns Updated inventory record.
   */
  async toggleFavorite(playerId: string, inventoryId: string) {
    const item = await this.prisma.inventory.findFirst({
      where: { id: inventoryId, playerId },
    });

    if (!item) {
      throw new NotFoundException(`INVENTORY_ITEM_NOT_FOUND: Item ${inventoryId} not found.`);
    }

    return this.prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        isFavorite: !item.isFavorite,
      },
    });
  }
}
