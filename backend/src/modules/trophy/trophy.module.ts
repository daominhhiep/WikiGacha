import { Module } from '@nestjs/common';
import { TrophyService } from './trophy.service';
import { TrophyController } from './trophy.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TrophyController],
  providers: [TrophyService],
  exports: [TrophyService],
})
export class TrophyModule {}
