import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateSupplierDto,
  Supplier,
  CreatePurchaseOrderDto,
  PurchaseOrder,
  ReceiveGoodsDto,
} from './purchase.service';
import { PurchaseService } from './purchase.service';

@Controller('purchase')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  // ===== Supplier CRUD =====

  @Post('suppliers')
  createSupplier(@Body() dto: CreateSupplierDto): Supplier {
    return this.purchaseService.createSupplier(dto);
  }

  @Get('suppliers')
  listSuppliers(): Supplier[] {
    return this.purchaseService.listSuppliers();
  }

  @Get('suppliers/:id')
  getSupplier(@Param() params: { id: string }): Supplier {
    try {
      return this.purchaseService.getSupplier(params.id);
    } catch (e: any) {
      throw new NotFoundException(e.message);
    }
  }

  @Patch('suppliers/:id')
  updateSupplier(
    @Param() params: { id: string },
    @Body() dto: Partial<CreateSupplierDto>,
  ): Supplier {
    try {
      return this.purchaseService.updateSupplier(params.id, dto);
    } catch (e: any) {
      throw new NotFoundException(e.message);
    }
  }

  @Delete('suppliers/:id')
  deleteSupplier(@Param() params: { id: string }): void {
    try {
      this.purchaseService.deleteSupplier(params.id);
    } catch (e: any) {
      throw new NotFoundException(e.message);
    }
  }

  // ===== Purchase Order CRUD =====

  @Post('orders')
  createPurchaseOrder(@Body() dto: CreatePurchaseOrderDto): PurchaseOrder {
    return this.purchaseService.createPurchaseOrder(dto);
  }

  @Get('orders')
  listPurchaseOrders(): PurchaseOrder[] {
    return this.purchaseService.listPurchaseOrders();
  }

  @Get('orders/:id')
  getPurchaseOrder(@Param() params: { id: string }): PurchaseOrder {
    try {
      return this.purchaseService.getPurchaseOrder(params.id);
    } catch (e: any) {
      throw new NotFoundException(e.message);
    }
  }

  @Patch('orders/:id/confirm')
  confirmPurchaseOrder(@Param() params: { id: string }): PurchaseOrder {
    try {
      return this.purchaseService.confirmPurchaseOrder(params.id);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Patch('orders/:id/receive')
  receivePurchaseOrder(
    @Param() params: { id: string },
    @Body() dto: ReceiveGoodsDto,
  ): PurchaseOrder {
    try {
      return this.purchaseService.receivePurchaseOrder(params.id, dto);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  @Patch('orders/:id/cancel')
  cancelPurchaseOrder(@Param() params: { id: string }): PurchaseOrder {
    try {
      return this.purchaseService.cancelPurchaseOrder(params.id);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
