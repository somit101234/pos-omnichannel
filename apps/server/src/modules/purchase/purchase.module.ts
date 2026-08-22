import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { SupplierController } from './supplier.controller';

@Module({
  providers: [PurchaseService],
  controllers: [PurchaseController, SupplierController],
  exports: [PurchaseService],
})
export class PurchaseModule {}
