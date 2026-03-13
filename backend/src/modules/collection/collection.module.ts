import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}
