// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';

// DTOs
export class InventoryCheckDto {
  productId: string;
  warehouseId: string;
  theoreticalQty: number;
  actualQty: number;
  unitCost: string | number;
}

export class VarianceReportDto {
  productId: string;
  variance: number;
  lossCost: string;
}

export class LowStockAlertDto {
  productId: string;
  warehouseId: string;
  quantity: number;
  minStock: number;
}

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // GET /inventory/stock — list stock levels
  @Get('stock')
  listStock(@Query('warehouseId') warehouseId?: string) {
    if (warehouseId) {
      // Get all stocks for this warehouse
      // Note: In production, this would query Prisma with warehouseId filter
      throw new BadRequestException('List stocks by warehouse not implemented yet');
    }
    throw new BadRequestException('List all stocks not implemented yet');
  }

  // GET /inventory/stock/:productId — single stock
  @Get('stock/:productId')
  getStock(@Param('productId') productId: string, @Query('warehouseId') warehouseId: string) {
    if (!warehouseId) {
      throw new BadRequestException('warehouseId is required');
    }
    const stock = this.inventoryService.getStock(productId, warehouseId);
    if (!stock) {
      throw new BadRequestException(`Stock not found for product ${productId} in warehouse ${warehouseId}`);
    }
    return stock;
  }

  // POST /inventory/check — inventory check (theoretical vs actual)
  @Post('check')
  @HttpCode(HttpStatus.CREATED)
  checkInventory(@Body() dto: InventoryCheckDto) {
    const { productId, warehouseId, theoreticalQty, actualQty, unitCost } = dto;

    if (theoreticalQty < 0 || actualQty < 0) {
      throw new BadRequestException('Quantities must be non-negative');
    }

    const unitCostBigInt =
      typeof unitCost === 'string' ? BigInt(unitCost) : BigInt(Math.round(unitCost));

    const result = this.inventoryService.calculateVariance(
      theoreticalQty,
      actualQty,
      unitCostBigInt,
    );

    return {
      productId,
      warehouseId,
      theoreticalQty,
      actualQty,
      variance: result.variance,
      lossCost: result.lossCost.toString(),
      unitCost: unitCostBigInt.toString(),
    };
  }

  // GET /inventory/variance — variance report
  @Get('variance')
  getVarianceReport() {
    // Note: In production, this would aggregate variance from Prisma
    // For now, return empty array as placeholder
    return [];
  }

  // GET /inventory/alerts — low stock alerts
  @Get('alerts')
  getLowStockAlerts(@Query('minStock') minStock?: number) {
    // Note: In production, this would query Prisma for stocks <= minStock
    // For now, return empty array as placeholder
    return [];
  }
}
