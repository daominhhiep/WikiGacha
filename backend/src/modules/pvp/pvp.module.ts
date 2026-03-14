import { Module } from '@nestjs/common';
import { PvPMatchmakingService } from './pvp-matchmaking.service';

@Module({
  providers: [PvPMatchmakingService],
  exports: [PvPMatchmakingService],
})
export class PvPModule {}
