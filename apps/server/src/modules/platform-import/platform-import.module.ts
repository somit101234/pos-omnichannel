import { Module } from '@nestjs/common';
import { PlatformImportService } from './platform-import.service';
import { PlatformImportController } from './platform-import.controller';
import { ShopeeAdapter } from './adapters/shopee.adapter';
import { GrabFoodAdapter } from './adapters/grabfood.adapter';
import { BeFoodAdapter } from './adapters/befood.adapter';

@Module({
  controllers: [PlatformImportController],
  providers: [
    PlatformImportService,
    ShopeeAdapter,
    GrabFoodAdapter,
    BeFoodAdapter,
  ],
})
export class PlatformImportModule {
  constructor(
    private platformImportService: PlatformImportService,
    private shopeeAdapter: ShopeeAdapter,
    private grabFoodAdapter: GrabFoodAdapter,
    private beFoodAdapter: BeFoodAdapter,
  ) {
    // Register adapters
    this.platformImportService.registerAdapter('SHOPEE', this.shopeeAdapter);
    this.platformImportService.registerAdapter('GRABFOOD', this.grabFoodAdapter);
    this.platformImportService.registerAdapter('BEOFORD', this.beFoodAdapter);
  }
}
