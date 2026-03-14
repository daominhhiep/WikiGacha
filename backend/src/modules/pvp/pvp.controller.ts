import { Controller, Get, Param, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BattleService } from '../battle/battle.service';

interface RequestWithUser extends ExpressRequest {
  user: { userId: string; username: string };
}

@UseGuards(JwtAuthGuard)
@Controller('pvp')
export class PvPController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly battleService: BattleService,
  ) {}

  @Get('match/:id')
  async getMatch(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = req.user.userId;

    const match = await this.prisma.pvPMatch.findUnique({
      where: { id },
      include: {
        player1: {
          select: { id: true, username: true, avatarUrl: true, eloRating: true },
        },
        player2: {
          select: { id: true, username: true, avatarUrl: true, eloRating: true },
        },
      },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.player1Id !== userId && match.player2Id !== userId) {
      throw new NotFoundException('Match not found for this user');
    }

    // Reconstruct participants from deck snapshots stored in match
    const p1Deck = (match.player1Deck as string[]) || [];
    const p2Deck = (match.player2Deck as string[]) || [];

    const [p1, p2] = await Promise.all([
      this.battleService.getParticipant(match.player1Id, p1Deck),
      this.battleService.getParticipant(match.player2Id, p2Deck),
    ]);

    return {
      ...match,
      participants: { p1, p2 },
      log: (match.logs as string[]) || [],
      rewards: { credits: 50, xp: 100 }, // Matching simulation defaults
    };
  }
}
