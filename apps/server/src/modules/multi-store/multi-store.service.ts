import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── DTOs ───────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  address: string | null;
  ownerId: string;
  createdAt: Date;
}

export interface Warehouse {
  id: string;
  storeId: string;
  name: string;
  address: string | null;
  createdAt: Date;
}

export interface StockTransfer {
  id: string;
  storeId: string;
  sourceWarehouseId: string;
  targetWarehouseId: string;
  productId: string;
  quantity: number;
  timestamp: Date;
}

export interface StoreDashboard {
  id: string;
  name: string;
  revenue: number;
  orderCount: number;
}

// ── MultiStore Service ─────────────────────────────────────────────────────

@Injectable()
export class MultiStoreService {
  constructor(private prisma: PrismaService) {}

  // ── Store management ─────────────────────────────────────────────────────

  async createStore(dto: { name: string; address: string; ownerId: string }): Promise<Store> {
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Store name is required');
    }

    const existing = await this.prisma.store.findFirst({
      where: { name: dto.name.trim() },
    });
    if (existing) {
      throw new BadRequestException('Store name already exists');
    }

    const store = await this.prisma.store.create({
      data: {
        name: dto.name.trim(),
        address: dto.address || undefined,
        ownerId: dto.ownerId,
      },
    });

    return {
      id: store.id,
      name: store.name,
      address: store.address,
      ownerId: store.ownerId,
      createdAt: store.createdAt,
    };
  }

  async getStores(): Promise<Store[]> {
    const stores: any[] = await this.prisma.store.findMany();
    return stores.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      ownerId: s.ownerId,
      createdAt: s.createdAt,
    }));
  }

  async getStoreById(id: string): Promise<Store | undefined> {
    const store = await this.prisma.store.findUnique({
      where: { id },
    });
    if (!store) {
      return undefined;
    }
    return {
      id: store.id,
      name: store.name,
      address: store.address,
      ownerId: store.ownerId,
      createdAt: store.createdAt,
    };
  }

  async updateStore(id: string, dto: { name?: string; address?: string }): Promise<Store> {
    const existing = await this.prisma.store.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new BadRequestException(`Store with ID "${id}" not found`);
    }

    const updates: any = {};
    if (dto.name !== undefined) {
      if (dto.name.trim() === '') {
        throw new BadRequestException('Store name cannot be empty');
      }
      if (dto.name.length > 100) {
        throw new BadRequestException('Store name must be at most 100 characters');
      }
      updates.name = dto.name.trim();
    }
    if (dto.address !== undefined) {
      updates.address = dto.address || null;
    }

    const updated = await this.prisma.store.update({
      where: { id },
      data: updates,
    });

    return {
      id: updated.id,
      name: updated.name,
      address: updated.address,
      ownerId: updated.ownerId,
      createdAt: updated.createdAt,
    };
  }

  async getStoreByName(name: string): Promise<Store | undefined> {
    const store = await this.prisma.store.findFirst({
      where: { name: name.trim() },
    });
    if (!store) {
      return undefined;
    }
    return {
      id: store.id,
      name: store.name,
      address: store.address,
      ownerId: store.ownerId,
      createdAt: store.createdAt,
    };
  }

  // ── Warehouse management ─────────────────────────────────────────────────

  async createWarehouse(storeName: string, dto: { name: string; address: string }): Promise<Warehouse> {
    const store = await this.getStoreByName(storeName);
    if (!store) {
      throw new BadRequestException(`Store "${storeName}" not found`);
    }

    const existing = await this.prisma.warehouse.findFirst({
      where: { storeId: store.id, name: dto.name.trim() },
    });
    if (existing) {
      throw new BadRequestException('Warehouse name already exists in this store');
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        storeId: store.id,
        name: dto.name.trim(),
        address: dto.address || undefined,
      },
    });

    return {
      id: warehouse.id,
      storeId: warehouse.storeId,
      name: warehouse.name,
      address: warehouse.address,
      createdAt: warehouse.createdAt,
    };
  }

  async getWarehouses(storeName: string): Promise<Warehouse[]> {
    const store = await this.getStoreByName(storeName);
    if (!store) {
      throw new BadRequestException(`Store "${storeName}" not found`);
    }

    const warehouses: any[] = await this.prisma.warehouse.findMany({
      where: { storeId: store.id },
    });

    return warehouses.map((w) => ({
      id: w.id,
      storeId: w.storeId,
      name: w.name,
      address: w.address,
      createdAt: w.createdAt,
    }));
  }

  async getWarehouseById(warehouseId: string): Promise<Warehouse | undefined> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });
    if (!warehouse) {
      return undefined;
    }
    return {
      id: warehouse.id,
      storeId: warehouse.storeId,
      name: warehouse.name,
      address: warehouse.address,
      createdAt: warehouse.createdAt,
    };
  }

  // ── Stock management ─────────────────────────────────────────────────────

  async registerStock(warehouseId: string, productId: string, quantity: number): Promise<void> {
    await this.prisma.stock.upsert({
      where: { warehouseId_productId: { warehouseId, productId } },
      update: { quantity },
      create: { warehouseId, productId, quantity },
    });
  }

  async getStock(warehouseId: string, productId: string): Promise<number> {
    const stock = await this.prisma.stock.findUnique({
      where: { warehouseId_productId: { warehouseId, productId } },
    });
    return stock?.quantity ?? 0;
  }

  async transferStock(
    storeName: string,
    sourceWarehouseName: string,
    targetWarehouseName: string,
    productId: string,
    quantity: number
  ): Promise<{ sourceRemaining: number; targetUpdated: boolean }> {
    const store = await this.getStoreByName(storeName);
    if (!store) {
      throw new BadRequestException(`Store "${storeName}" not found`);
    }

    const sourceWarehouse = await this.prisma.warehouse.findFirst({
      where: { storeId: store.id, name: sourceWarehouseName },
    });
    if (!sourceWarehouse) {
      throw new BadRequestException(`Source warehouse "${sourceWarehouseName}" not found`);
    }

    const targetWarehouse = await this.prisma.warehouse.findFirst({
      where: { storeId: store.id, name: targetWarehouseName },
    });
    if (!targetWarehouse) {
      throw new BadRequestException(`Target warehouse "${targetWarehouseName}" not found`);
    }

    const result = await this.prisma.$transaction(async (tx: any) => {
      const sourceStock = await tx.stock.findUnique({
        where: { warehouseId_productId: { warehouseId: sourceWarehouse.id, productId } },
      });
      const currentStock = sourceStock?.quantity ?? 0;

      if (currentStock < quantity) {
        throw new BadRequestException(
          `Insufficient stock in source warehouse: available=${currentStock}, requested=${quantity}`
        );
      }

      await tx.stock.update({
        where: { warehouseId_productId: { warehouseId: sourceWarehouse.id, productId } },
        data: { quantity: currentStock - quantity },
      });

      const targetStock = await tx.stock.findUnique({
        where: { warehouseId_productId: { warehouseId: targetWarehouse.id, productId } },
      });

      await tx.stock.upsert({
        where: { warehouseId_productId: { warehouseId: targetWarehouse.id, productId } },
        update: {
          quantity: (targetStock?.quantity ?? 0) + quantity,
        },
        create: { warehouseId: targetWarehouse.id, productId, quantity },
      });

      await tx.transaction.create({
        data: {
          storeId: store.id,
          cashierId: 'system',
          type: 'TRANSFER',
          status: 'COMPLETED',
          total: BigInt(0),
          paymentMethod: 'INTERNAL',
          transactionItems: {
            create: { productId, quantity, unitPrice: BigInt(0) },
          },
        },
      });

      return currentStock - quantity;
    });

    return { sourceRemaining: result, targetUpdated: true };
  }

  // ── Dashboard (placeholder) ──────────────────────────────────────────────

  getDashboardSummary(): { stores: StoreDashboard[] } {
    return { stores: [] };
  }

  setMockRevenue(storeId: string, revenue: number): void {
    // Mock helper for testing
  }

  setMockOrderCount(storeId: string, count: number): void {
    // Mock helper for testing
  }
}
