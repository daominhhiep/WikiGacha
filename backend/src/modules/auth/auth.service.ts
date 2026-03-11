import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Player } from '../../generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async guestLogin(username?: string) {
    let player: Player | null = null;

    if (username) {
      player = await this.prisma.player.findUnique({
        where: { username },
      });
    }

    if (!player) {
      const finalUsername = username || `Guest_${Math.random().toString(36).substring(2, 9)}`;
      player = await this.prisma.player.create({
        data: {
          username: finalUsername,
        },
      });
    }

    const payload = { sub: player.id, username: player.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      player,
      accessToken,
    };
  }
}
