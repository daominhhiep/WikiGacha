import { Module } from '@nestjs/common';
import { MissionService } from './mission.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MissionService],
  exports: [MissionService],
})
export class MissionModule {}
