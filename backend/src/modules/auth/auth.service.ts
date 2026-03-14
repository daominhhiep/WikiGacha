import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Player } from '../../generated/prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { MissionService } from '../mission/mission.service';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly missionService: MissionService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async verifyGoogleIdToken(token: string) {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      console.log(`[Google Auth] Attempting to verify token for audience: ${clientId}`);

      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: clientId,
      });
      const payload = ticket.getPayload();

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid Google token payload');
      }

      console.log(`[Google Auth] Token verified for sub: ${payload.sub}, email: ${payload.email}`);

      const userDetails = {
        googleId: payload.sub,
        email: payload.email || '',
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        picture: payload.picture || '',
      };

      const player = await this.validateGoogleUser(userDetails);
      const accessToken = await this.generateToken(player);

      return {
        player,
        accessToken,
      };
    } catch (error) {
      console.error(`[Google Auth] Verification error: ${error.message}`);
      throw new UnauthorizedException('Failed to verify Google token: ' + error.message);
    }
  }

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
      // Assign initial missions for new user
      await this.missionService.assignInitialMissions(player.id);
    }

    const payload = { sub: player.id, username: player.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      player,
      accessToken,
    };
  }

  async validateGoogleUser(details: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  }) {
    let player = await this.prisma.player.findUnique({
      where: { googleId: details.googleId },
    });

    if (!player) {
      // Check if user with same email exists
      player = await this.prisma.player.findFirst({
        where: { email: details.email },
      });

      if (player) {
        // Link google ID to existing account
        player = await this.prisma.player.update({
          where: { id: player.id },
          data: { googleId: details.googleId, avatarUrl: details.picture },
        });
      } else {
        // Create new account
        const username = `${details.firstName}_${details.lastName}_${Math.random().toString(36).substring(2, 5)}`;
        player = await this.prisma.player.create({
          data: {
            googleId: details.googleId,
            email: details.email,
            username: username,
            avatarUrl: details.picture,
          },
        });
        // Assign initial missions for new user
        await this.missionService.assignInitialMissions(player.id);
      }
    } else {
      // Update profile pic if changed
      if (player.avatarUrl !== details.picture) {
        player = await this.prisma.player.update({
          where: { id: player.id },
          data: { avatarUrl: details.picture },
        });
      }
    }

    return player;
  }

  async generateToken(player: Player) {
    const payload = { sub: player.id, username: player.username };
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (e) {
      return null;
    }
  }

  async getPlayerById(id: string) {
    return this.prisma.player.findUnique({
      where: { id },
    });
  }
}
