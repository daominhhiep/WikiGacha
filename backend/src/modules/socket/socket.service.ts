import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server;
  private readonly logger = new Logger(SocketService.name);

  /**
   * Set the Socket.IO server instance.
   * This is typically called by a gateway on initialization.
   * @param server The Socket.IO server.
   */
  setServer(server: Server) {
    this.server = server;
    this.logger.log('Socket server instance set in SocketService.');
  }

  /**
   * Returns the Socket.IO server instance.
   * @returns The Socket.IO server.
   */
  getServer(): Server {
    return this.server;
  }

  /**
   * Emit an event to a room or all clients.
   * @param event The event name.
   * @param data The data to emit.
   * @param room (Optional) The room to emit the event to.
   */
  emit(event: string, data: any, room?: string) {
    if (!this.server) {
      this.logger.warn(
        `Attempted to emit event "${event}" but the socket server is not yet initialized.`,
      );
      return;
    }

    if (room) {
      this.server.to(room).emit(event, data);
    } else {
      this.server.emit(event, data);
    }
  }
}
