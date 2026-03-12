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
}
