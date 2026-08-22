import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { CreateSupplierDto, Supplier } from './purchase.service';
import { PurchaseService } from './purchase.service';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  createSupplier(@Body() dto: CreateSupplierDto): Supplier {
    return this.purchaseService.createSupplier(dto);
  }

  @Get()
  listSuppliers(): Supplier[] {
    return this.purchaseService.listSuppliers();
  }

  @Get(':id')
  getSupplier(@Param() params: { id: string }): Supplier {
    try {
      return this.purchaseService.getSupplier(params.id);
    } catch (e: any) {
      throw new NotFoundException(e.message);
    }
  }

  @Patch(':id')
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

  @Delete(':id')
  deleteSupplier(@Param() params: { id: string }): void {
    try {
      this.purchaseService.deleteSupplier(params.id);
    } catch (e: any) {
      throw new NotFoundException(e.message);
    }
  }
}
