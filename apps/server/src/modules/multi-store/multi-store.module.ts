import { Module } from '@nestjs/common';
import { MultiStoreService } from './multi-store.service';
import { MultiStoreController } from './multi-store.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MultiStoreService],
  controllers: [MultiStoreController],
  exports: [MultiStoreService],
})
export class MultiStoreModule {}
