import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { CardModule } from './modules/card/card.module';
import { CollectionModule } from './modules/collection/collection.module';
import { BattleModule } from './modules/battle/battle.module';
import { SocketModule } from './modules/socket/socket.module';
import { MissionModule } from './modules/mission/mission.module';
import { TrophyModule } from './modules/trophy/trophy.module';
import { PvPModule } from './modules/pvp/pvp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    RedisModule,
    AuthModule,
    CardModule,
    CollectionModule,
    BattleModule,
    SocketModule,
    MissionModule,
    TrophyModule,
    PvPModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
