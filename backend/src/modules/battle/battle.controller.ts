import { Controller, Post, Get, Body, UseGuards, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { BattleService } from './battle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsArray, IsOptional, IsString } from 'class-validator';

class StartBattleDto {
  @ApiProperty({ description: 'Array of card IDs from inventory' })
  @IsArray()
  @IsString({ each: true })
  deckIds: string[];

  @ApiProperty({ description: 'Optional opponent player ID', required: false })
  @IsOptional()
  @IsString()
  opponentId?: string;
}

@ApiTags('battle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('battle')
export class BattleController {
  constructor(private readonly battleService: BattleService) {}

  @ApiOperation({ summary: 'Start an auto-battle' })
  @ApiResponse({ status: 201, description: 'Battle completed' })
  @Post('start')
  async startBattle(@Req() req: any, @Body() dto: StartBattleDto) {
    return this.battleService.startBattle(req.user.userId, dto.deckIds, dto.opponentId);
  }

  @ApiOperation({ summary: 'Get battle history' })
  @ApiResponse({ status: 200, description: 'List of past battles' })
  @Get('history')
  async getHistory(@Req() req: any) {
    return this.battleService.getBattleHistory(req.user.userId);
  }

  @ApiOperation({ summary: 'Get single battle details' })
  @ApiResponse({ status: 200, description: 'Single battle details' })
  @Get(':id')
  async getBattle(@Param('id') id: string, @Req() req: any) {
    return this.battleService.getBattle(id, req.user.userId);
  }
}
