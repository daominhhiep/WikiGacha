import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {
    super({
      host: configService.get<string>('REDIS_HOST', 'localhost'),
      port: configService.get<number>('REDIS_PORT', 6379),
    });

    this.on('error', (err) => {
      this.logger.error('Redis error', err);
    });

    this.on('connect', () => {
      this.logger.log('Redis connected');
    });
  }

  async onModuleInit() {
    // Connection is already established in constructor
  }

  async onModuleDestroy() {
    await this.quit();
  }

  // Matchmaking Helpers
  async addToQueue(queueName: string, value: string) {
    return this.rpush(queueName, value);
  }

  async removeFromQueue(queueName: string, value: string): Promise<number> {
    return this.lrem(queueName, 0, value);
  }

  async popFromQueue(queueName: string): Promise<string | null> {
    return this.lpop(queueName);
  }

  async getQueueLength(queueName: string): Promise<number> {
    return this.llen(queueName);
  }
}
