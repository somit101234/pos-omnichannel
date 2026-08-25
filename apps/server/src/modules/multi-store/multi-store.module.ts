import { Module } from '@nestjs/common';
import { MultiStoreService } from './multi-store.service';
import { MultiStoreController } from './multi-store.controller';

@Module({
  providers: [MultiStoreService],
  controllers: [MultiStoreController],
  exports: [MultiStoreService],
})
export class MultiStoreModule {}
