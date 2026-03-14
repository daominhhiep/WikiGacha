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
import { PvPMatch } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'pvp',
})
export class PvPGateway extends BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    protected readonly socketService: SocketService,
    private readonly pvpMatchmakingService: PvPMatchmakingService,
  ) {
    super(socketService);
  }

  @SubscribeMessage('join_queue')
  async handleJoinQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    this.logger.log(`Player ${userId} requested to join queue`);

    // Ensure client is in a room named after their userId to receive notifications
    await client.join(userId);

    const result = await this.pvpMatchmakingService.joinQueue(userId);

    if (result.status === 'MATCHED' && result.match) {
      const match: PvPMatch = result.match;
      // Notify both players
      this.server.to(match.player1Id).emit('match_found', match);
      this.server.to(match.player2Id).emit('match_found', match);

      this.logger.log(`Match found: ${match.player1Id} vs ${match.player2Id}`);
    }

    return result;
  }
  @SubscribeMessage('leave_queue')
  async handleLeaveQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    this.logger.log(`Player ${userId} requested to leave queue`);
    return await this.pvpMatchmakingService.leaveQueue(userId);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to PvP namespace: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from PvP namespace: ${client.id}`);
  }
}
