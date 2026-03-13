import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SocketService } from './socket.service';

/**
 * BaseGateway handles common WebSocket logic such as connection and disconnection events.
 * It is meant to be extended by specific feature gateways.
 */
export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  protected server: Server;

  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly socketService: SocketService) {}

  /**
   * Called on gateway initialization.
   * Sets the server instance in SocketService.
   * If overridden in child classes, super.afterInit(server) must be called.
   */
  afterInit(server: Server) {
    this.socketService.setServer(server);
    this.logger.log('WebSocket Gateway initialized.');
  }

  /**
   * Called when a client connects to the gateway.
   * Logs the connection and can be overridden for custom logic.
   * @param client The socket client instance.
   */
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  /**
   * Called when a client disconnects from the gateway.
   * Logs the disconnection and can be overridden for custom logic.
   * @param client The socket client instance.
   */
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Helper method to emit events to specific rooms or clients.
   * @param event The event name.
   * @param data The data to emit.
   * @param room (Optional) The room to emit the event to.
   */
  protected emitEvent(event: string, data: any, room?: string) {
    this.socketService.emit(event, data, room);
  }
}
