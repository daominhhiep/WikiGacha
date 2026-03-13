import { Controller, Get, Param, Patch, UseGuards, Request, Logger, Query } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CollectionService } from './collection.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollectionQueryDto } from './dto/collection-query.dto';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    username: string;
  };
}

/**
 * Controller for managing a player's card collection.
 */
@ApiTags('collection')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('collection')
export class CollectionController {
  private readonly logger = new Logger(CollectionController.name);

  constructor(private readonly collectionService: CollectionService) {}

  /**
   * Fetches the entire collection of cards owned by the authenticated player.
   * Supports pagination and filtering.
   *
   * @param req The request object containing user information.
   * @param query The query parameters for pagination and filtering.
   * @returns Paginated list of collection items with card details.
   */
  @ApiOperation({ summary: 'Get player collection' })
  @ApiResponse({ status: 200, description: 'Collection retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async getCollection(@Request() req: RequestWithUser, @Query() query: CollectionQueryDto) {
    this.logger.log(`Fetching collection for user ${req.user.userId} (Page: ${query.page})`);
    return this.collectionService.getPlayerCollection(req.user.userId, query);
  }

  /**
   * Fetches details for a specific card in the player's collection.
   *
   * @param req The request object.
   * @param cardId The ID of the card to retrieve.
   * @returns Detailed card record if owned by player.
   */
  @ApiOperation({ summary: 'Get specific card from collection' })
  @ApiResponse({ status: 200, description: 'Card details retrieved' })
  @ApiResponse({ status: 404, description: 'Card not found in collection' })
  @Get(':cardId')
  async getCard(@Request() req: RequestWithUser, @Param('cardId') cardId: string) {
    this.logger.log(`Fetching card ${cardId} for user ${req.user.userId}`);
    return this.collectionService.getCardInCollection(req.user.userId, cardId);
  }

  /**
   * Toggles the favorite status of an inventory item.
   *
   * @param req The request object.
   * @param inventoryId The unique ID of the inventory record.
   * @returns Updated inventory record.
   */
  @ApiOperation({ summary: 'Toggle favorite status' })
  @ApiResponse({ status: 200, description: 'Favorite status updated' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  @Patch(':inventoryId/favorite')
  async toggleFavorite(@Request() req: RequestWithUser, @Param('inventoryId') inventoryId: string) {
    this.logger.log(`Toggling favorite for item ${inventoryId} (User: ${req.user.userId})`);
    return this.collectionService.toggleFavorite(req.user.userId, inventoryId);
  }
}
