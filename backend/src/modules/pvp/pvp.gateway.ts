import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BaseGateway } from '../socket/base.gateway';
import { SocketService } from '../socket/socket.service';
import { PvPMatchmakingService } from './pvp-matchmaking.service';
import { AuthService } from '../auth/auth.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BattleEngine } from '../battle/battle-engine';
import { PrismaService } from '../../common/prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/pvp',
})
export class PvPGateway extends BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    protected readonly socketService: SocketService,
    private readonly pvpMatchmakingService: PvPMatchmakingService,
    private readonly authService: AuthService,
    private readonly prismaService: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(socketService);
  }

  handleConnection(client: Socket) {
    this.authenticateConnection(client).catch((err) => {
      this.logger.error(`Connection authentication failed: ${err.message}`);
      client.disconnect();
    });
  }

  private async authenticateConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn(`Client ${client.id} attempted to connect without token`);
      client.disconnect();
      return;
    }

    const payload = await this.authService.verifyToken(token);
    if (!payload || !payload.sub) {
      this.logger.warn(`Client ${client.id} provided invalid token`);
      client.disconnect();
      return;
    }

    // Store userId in socket for later use
    (client as AuthenticatedSocket).userId = payload.sub;
    this.logger.log(`Client ${client.id} (User: ${payload.sub}) connected to PvP namespace`);

    // Join room for this user to receive direct messages
    await client.join(payload.sub);
  }

  @SubscribeMessage('join_queue')
  async handleJoinQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { deckIds: string[] },
  ) {
    const userId = client.userId;
    if (!userId) {
      this.logger.error(`Unauthorized join_queue attempt from ${client.id}`);
      return { status: 'ERROR', message: 'UNAUTHORIZED' };
    }

    this.logger.log(`Player ${userId} requested to join queue with cards: ${data.deckIds?.length}`);

    const result = await this.pvpMatchmakingService.joinQueue(userId, data.deckIds || []);

    if (result.status === 'MATCHED' && result.match) {
      const match = result.match as any;

      // Notify both players in the match
      this.logger.log(`Match found! Notifying ${match.player1Id} and ${match.player2Id}`);

      this.server.to(match.player1Id).emit('match_found', match);
      this.server.to(match.player2Id).emit('match_found', match);

      // Start the simulation loop
      this.startPvPSimulation(match);
    }

    return result;
  }

  private startPvPSimulation(match: any) {
    const { p1, p2 } = match.participants;
    const battleEngine = new BattleEngine();
    const result = battleEngine.simulate(p1, p2);

    this.logger.log(`Starting simulation for match ${match.id}`);

    // Emit steps with a delay to simulate real-time
    let turn = 0;
    const interval = setInterval(async () => {
      if (turn < result.log.length) {
        const step = result.log[turn];
        this.server.to(match.id).emit('battle_step', step);
        turn++;
      } else {
        clearInterval(interval);

        // Final result
        const finalResult = {
          battleId: match.id,
          winnerId: result.winnerId,
          participants: result.participants,
          log: result.log,
          rewards: { credits: 50, xp: 100 }, // MVP hardcoded rewards
        };

        this.server.to(match.id).emit('battle_finished', finalResult);

        // Update match status in DB
        await this.prismaService.pvPMatch.update({
          where: { id: match.id },
          data: {
            status: 'COMPLETED',
            winnerId: result.winnerId,
            logs: result.log as any,
          },
        });

        // Emit battle.won for Trophy collection
        this.eventEmitter.emit('battle.won', {
          playerId: match.player1Id,
          winnerId: result.winnerId,
          isWinner: result.winnerId === match.player1Id,
          isPvP: true,
        });

        this.eventEmitter.emit('battle.won', {
          playerId: match.player2Id,
          winnerId: result.winnerId,
          isWinner: result.winnerId === match.player2Id,
          isPvP: true,
        });
      }
    }, 1000); // 1 step per second
  }

  @SubscribeMessage('leave_queue')
  async handleLeaveQueue(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.userId;
    if (!userId) return { status: 'ERROR' };

    this.logger.log(`Player ${userId} requested to leave queue`);
    return await this.pvpMatchmakingService.leaveQueue(userId);
  }

  @SubscribeMessage('join_match')
  async handleJoinMatch(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    const userId = client.userId;
    if (!userId) return { status: 'ERROR' };

    this.logger.log(`Player ${userId} joining match room: ${data.matchId}`);

    // Join the match-specific room
    await client.join(data.matchId);

    return { status: 'JOINED' };
  }

  handleDisconnect(client: Socket) {
    const userId = (client as AuthenticatedSocket).userId;
    this.logger.log(
      `Client ${client.id} (User: ${userId || 'unknown'}) disconnected from PvP namespace`,
    );
  }
}
