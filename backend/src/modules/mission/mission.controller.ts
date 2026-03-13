import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MissionService } from './mission.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiProperty } from '@nestjs/swagger';

class ClaimRewardDto {
  @ApiProperty({ example: 'player-uuid' })
  userId: string;

  @ApiProperty({ example: 1 })
  userMissionId: number;
}

@ApiTags('mission')
@Controller('missions')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all static missions' })
  @ApiResponse({ status: 200, description: 'Return all missions defined in the game.' })
  async getMissions() {
    return this.missionService.getMissions();
  }

  @Get(':playerId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all missions for a player' })
  @ApiResponse({ status: 200, description: 'Return all missions and their progress for the player.' })
  async getPlayerMissions(@Param('playerId') playerId: string) {
    const missions = await this.missionService.getPlayerMissions(playerId);

    // If no missions assigned yet, assign them automatically
    if (missions.length === 0) {
      await this.missionService.assignInitialMissions(playerId);
      return this.missionService.getPlayerMissions(playerId);
    }

    return missions;
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Claim reward for a completed mission' })
  @ApiResponse({ status: 200, description: 'Reward successfully claimed.' })
  @ApiResponse({ status: 400, description: 'Mission not completed or already claimed.' })
  @ApiResponse({ status: 404, description: 'Mission not found for this player.' })
  async claimReward(@Body() claimRewardDto: ClaimRewardDto) {
    return this.missionService.claimReward(
      claimRewardDto.userId,
      claimRewardDto.userMissionId,
    );
  }
}
