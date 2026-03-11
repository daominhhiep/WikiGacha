import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { CardService } from './card.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';

export enum PackType {
  BASIC = 'BASIC',
  THEMED = 'THEMED',
}

/**
 * Data Transfer Object for opening a gacha pack.
 */
export class OpenPackDto {
  @ApiProperty({
    enum: PackType,
    description: 'The type of pack to open',
    example: PackType.BASIC,
  })
  @IsEnum(PackType)
  @IsNotEmpty()
  packType: PackType;
}

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    username: string;
  };
}

/**
 * Controller for handling gacha-related operations.
 * Provides endpoints for opening card packs and managing card generation.
 */
@ApiTags('gacha')
@ApiBearerAuth()
@Controller('gacha')
export class GachaController {
  private readonly logger = new Logger(GachaController.name);

  constructor(private readonly cardService: CardService) {}

  /**
   * Opens a card pack for the authenticated player.
   * Deducts credits and generates 5 random cards from Wikipedia.
   *
   * @param req The request object containing user information.
   * @param openPackDto The DTO containing pack selection details.
   * @returns An object containing the new cards and the remaining credits.
   */
  @ApiOperation({ summary: 'Open a gacha pack' })
  @ApiResponse({ status: 201, description: 'Pack opened successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient credits or player not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('open')
  async openPack(@Request() req: RequestWithUser, @Body() openPackDto: OpenPackDto) {
    // Currently we only have BASIC packs, but we'll use openPackDto for future extension
    this.logger.log(`Opening ${openPackDto.packType} pack for user ${req.user.userId}`);
    return this.cardService.openPack(req.user.userId);
  }
}
