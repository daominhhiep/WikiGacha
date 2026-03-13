import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CollectionQueryDto, SortOption } from './dto/collection-query.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Fetches cards in a player's inventory with pagination and filtering.
   *
   * @param playerId The unique player identifier.
   * @param query The pagination and filter parameters.
   * @returns Paginated list of inventory records including card metadata.
   */
  async getPlayerCollection(playerId: string, query: CollectionQueryDto) {
    const { page = 1, limit = 20, search, rarity, sortBy = SortOption.NEWEST } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryWhereInput = {
      playerId,
      card: {
        AND: [
          search ? { title: { contains: search } } : {},
          rarity ? { rarity } : {},
        ],
      },
    };

    let orderBy: Prisma.InventoryOrderByWithRelationInput = { acquiredAt: 'desc' };

    if (sortBy === SortOption.ALPHABETICAL) {
      orderBy = { card: { title: 'asc' } };
    } else if (sortBy === SortOption.RARITY) {
      // Note: Prisma enum sorting is alphabetical by default. 
      // For true game rarity order, we might need a numeric field or manual sort if collection is small.
      // But for SC-001/DB performance, we use what's available.
      orderBy = { card: { rarity: 'desc' } };
    }

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          card: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.inventory.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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
