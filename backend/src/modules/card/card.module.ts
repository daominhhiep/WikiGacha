import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WikiService } from './wiki.service';
import { CardService } from './card.service';
import { GachaController } from './card.controller';

@Module({
  imports: [HttpModule],
  controllers: [GachaController],
  providers: [WikiService, CardService],
  exports: [CardService, WikiService],
})
export class CardModule {}
