import { Module } from '@nestjs/common';
import { MobileSyncService } from './mobile-sync.service';
import { MobileSyncController } from './mobile-sync.controller';

@Module({
  controllers: [MobileSyncController],
  providers: [MobileSyncService],
  exports: [MobileSyncService],
})
export class MobileSyncModule {}
