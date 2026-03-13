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
@Controller('api/v1/mission')
export class MissionController {
  constructor(private readonly missionService: MissionService) {}

  @Get(':playerId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all missions for a player' })
  @ApiResponse({ status: 200, description: 'Return all missions and their progress for the player.' })
  async getPlayerMissions(@Param('playerId') playerId: string) {
    return this.missionService.findUserMissions(playerId);
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
