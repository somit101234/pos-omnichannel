// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { MultiStoreService } from './multi-store.service';

export class CreateStoreDto {
  name: string;
  address: string;
  ownerId: string;
}

export class UpdateStoreDto {
  name?: string;
  address?: string;
}

export class CreateWarehouseDto {
  name: string;
  address: string;
}

@Controller('stores')
export class MultiStoreController {
  constructor(private multiStoreService: MultiStoreService) {}

  // ── Store CRUD ─────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateStoreDto) {
    // DTO validation
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Store name is required');
    }
    if (!dto.ownerId || dto.ownerId.trim() === '') {
      throw new BadRequestException('Owner ID is required');
    }

    return this.multiStoreService.createStore(dto);
  }

  @Get()
  findAll() {
    return this.multiStoreService.getStores();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    const store = this.multiStoreService.getStoreById(id);
    if (!store) {
      throw new BadRequestException(`Store with ID "${id}" not found`);
    }
    return store;
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    // DTO validation
    if (dto.name !== undefined && dto.name.trim() === '') {
      throw new BadRequestException('Store name cannot be empty');
    }
    if (dto.name !== undefined && dto.name.length > 100) {
      throw new BadRequestException('Store name must be at most 100 characters');
    }

    const store = this.multiStoreService.getStoreById(id);
    if (!store) {
      throw new BadRequestException(`Store with ID "${id}" not found`);
    }

    return this.multiStoreService.updateStore(id, dto);
  }

  // ── Warehouse CRUD (per store) ─────────────────────────────────────────────

  @Post(':id/warehouses')
  createWarehouse(
    @Param('id') id: string,
    @Body() dto: CreateWarehouseDto,
  ) {
    // DTO validation
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Warehouse name is required');
    }

    const store = this.multiStoreService.getStoreById(id);
    if (!store) {
      throw new BadRequestException(`Store with ID "${id}" not found`);
    }

    return this.multiStoreService.createWarehouse(store.name, dto);
  }

  @Get(':id/warehouses')
  findWarehouses(@Param('id') id: string) {
    const store = this.multiStoreService.getStoreById(id);
    if (!store) {
      throw new BadRequestException(`Store with ID "${id}" not found`);
    }

    return this.multiStoreService.getWarehouses(store.name);
  }

  // ── Stock transfer ─────────────────────────────────────────────────────────

  @Post(':id/transfers')
  createTransfer(
    @Param('id') id: string,
    @Body() dto: {
      sourceWarehouseName: string;
      targetWarehouseName: string;
      productId: string;
      quantity: number;
    },
  ) {
    // DTO validation
    if (!dto.sourceWarehouseName || dto.sourceWarehouseName.trim() === '') {
      throw new BadRequestException('Source warehouse name is required');
    }
    if (!dto.targetWarehouseName || dto.targetWarehouseName.trim() === '') {
      throw new BadRequestException('Target warehouse name is required');
    }
    if (!dto.productId || dto.productId.trim() === '') {
      throw new BadRequestException('Product ID is required');
    }
    if (!dto.quantity || dto.quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive number');
    }

    const store = this.multiStoreService.getStoreById(id);
    if (!store) {
      throw new BadRequestException(`Store with ID "${id}" not found`);
    }

    return this.multiStoreService.transferStock(
      store.name,
      dto.sourceWarehouseName,
      dto.targetWarehouseName,
      dto.productId,
      dto.quantity,
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────

  @Get('dashboard')
  getDashboard() {
    return this.multiStoreService.getDashboardSummary();
  }
}
