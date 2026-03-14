import { Module } from '@nestjs/common';
import { PvPMatchmakingService } from './pvp-matchmaking.service';
import { PvPGateway } from './pvp.gateway';
import { AuthModule } from '../auth/auth.module';
import { BattleModule } from '../battle/battle.module';
import { PvPController } from './pvp.controller';

@Module({
  imports: [AuthModule, BattleModule],
  controllers: [PvPController],
  providers: [PvPMatchmakingService, PvPGateway],
  exports: [PvPMatchmakingService],
})
export class PvPModule {}
