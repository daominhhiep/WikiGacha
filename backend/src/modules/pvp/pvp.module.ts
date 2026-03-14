import { Module } from '@nestjs/common';
import { PvPMatchmakingService } from './pvp-matchmaking.service';
import { PvPGateway } from './pvp.gateway';

@Module({
  providers: [PvPMatchmakingService, PvPGateway],
  exports: [PvPMatchmakingService],
})
export class PvPModule {}
