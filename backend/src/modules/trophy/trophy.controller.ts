import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TrophyService } from './trophy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('trophy')
@Controller('trophy')
export class TrophyController {
  constructor(private readonly trophyService: TrophyService) {}

  @Get(':playerId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all trophies for a player' })
  @ApiResponse({ status: 200, description: 'Return all trophies unlocked by the player.' })
  async getPlayerTrophies(@Param('playerId') playerId: string) {
    return this.trophyService.findUserTrophies(playerId);
  }
}
