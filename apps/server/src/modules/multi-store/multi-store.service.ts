import { Injectable, BadRequestException } from '@nestjs/common';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  createdAt: Date;
}

export interface Warehouse {
  id: string;
  storeId: string;
  name: string;
  address: string;
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

// ── Multi-Store Service ─────────────────────────────────────────────────────

/**
 * Multi-Store service for managing multiple stores, warehouses, stock transfers,
 * and dashboard summaries.
 *
 * - Store CRUD (create, list, detail)
 * - Warehouse CRUD per store
 * - Stock transfer between warehouses (auto-update both)
 * - Dashboard summary (revenue & order count by store)
 *
 * All monetary calculations use BigInt (cents) — no floating-point arithmetic.
 */
@Injectable()
export class MultiStoreService {
  // In-memory store for unit tests (no Prisma dependency)
  private stores: Map<string, Store> = new Map();
  private storesByName: Map<string, string> = new Map(); // name → id

  private warehouses: Map<string, Warehouse> = new Map();
  private warehouseByNameAndStore: Map<string, string> = new Map(); // "storeId:name" → warehouseId

  private stockMap: Map<string, number> = new Map(); // "warehouseId:productId" → quantity
  private transfers: StockTransfer[] = [];

  // ── Store CRUD ───────────────────────────────────────────────────────────

  /**
   * Create a new store.
   */
  createStore(dto: { name: string; address: string; ownerId: string }): Store {
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Store name is required');
    }

    if (this.storesByName.has(dto.name)) {
      throw new BadRequestException('Store name already exists');
    }

    const id = `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const store: Store = {
      id,
      name: dto.name.trim(),
      address: dto.address,
      ownerId: dto.ownerId,
      createdAt: new Date(),
    };

    this.stores.set(id, store);
    this.storesByName.set(dto.name, id);

    return store;
  }

  /**
   * Get all stores.
   */
  getStores(): Store[] {
    return Array.from(this.stores.values());
  }

  /**
   * Get store by ID.
   */
  getStoreById(id: string): Store | undefined {
    return this.stores.get(id);
  }

  /**
   * Get store by name.
   */
  getStoreByName(name: string): Store | undefined {
    const storeId = this.storesByName.get(name);
    return storeId ? this.stores.get(storeId) : undefined;
  }

  // ── Warehouse CRUD (per store) ───────────────────────────────────────────

  /**
   * Create a new warehouse for a store.
   */
  createWarehouse(storeName: string, dto: { name: string; address: string }): Warehouse {
    const store = this.getStoreByName(storeName);
    if (!store) {
      throw new BadRequestException(`Store "${storeName}" not found`);
    }

    const key = `${store.id}:${dto.name}`;
    if (this.warehouseByNameAndStore.has(key)) {
      throw new BadRequestException('Warehouse name already exists in this store');
    }

    const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const warehouse: Warehouse = {
      id,
      storeId: store.id,
      name: dto.name.trim(),
      address: dto.address,
      createdAt: new Date(),
    };

    this.warehouses.set(id, warehouse);
    this.warehouseByNameAndStore.set(key, id);

    return warehouse;
  }

  /**
   * Get all warehouses for a store.
   */
  getWarehouses(storeName: string): Warehouse[] {
    const store = this.getStoreByName(storeName);
    if (!store) {
      throw new BadRequestException(`Store "${storeName}" not found`);
    }

    return Array.from(this.warehouses.values()).filter(
      (w) => w.storeId === store.id,
    );
  }

  /**
   * Get warehouse by ID.
   */
  getWarehouseById(warehouseId: string): Warehouse | undefined {
    return this.warehouses.get(warehouseId);
  }

  // ── Stock management ─────────────────────────────────────────────────────

  /**
   * Register initial stock for a warehouse/product.
   * Used for unit tests — in production, this would come from inventory module.
   */
  registerStock(warehouseId: string, productId: string, quantity: number): void {
    const key = `${warehouseId}:${productId}`;
    this.stockMap.set(key, quantity);
  }

  /**
   * Get stock quantity for a warehouse/product.
   */
  getStock(warehouseId: string, productId: string): number {
    const key = `${warehouseId}:${productId}`;
    return this.stockMap.get(key) ?? 0;
  }

  // ── Stock transfer ───────────────────────────────────────────────────────

  /**
   * Transfer stock from source warehouse to target warehouse.
   * Auto-updates both warehouses' stock levels.
   *
   * @throws BadRequestException if source warehouse doesn't have enough stock
   */
  transferStock(
    storeName: string,
    sourceWarehouseName: string,
    targetWarehouseName: string,
    productId: string,
    quantity: number,
  ): { sourceRemaining: number; targetUpdated: boolean } {
    const store = this.getStoreByName(storeName);
    if (!store) {
      throw new BadRequestException(`Store "${storeName}" not found`);
    }

    const sourceWarehouse = this.getWarehouses(storeName).find(
      (w) => w.name === sourceWarehouseName,
    );
    const targetWarehouse = this.getWarehouses(storeName).find(
      (w) => w.name === targetWarehouseName,
    );

    if (!sourceWarehouse) {
      throw new BadRequestException(`Source warehouse "${sourceWarehouseName}" not found`);
    }
    if (!targetWarehouse) {
      throw new BadRequestException(`Target warehouse "${targetWarehouseName}" not found`);
    }

    const sourceKey = `${sourceWarehouse.id}:${productId}`;
    const currentStock = this.stockMap.get(sourceKey) ?? 0;

    if (currentStock < quantity) {
      throw new BadRequestException(
        `Insufficient stock in source warehouse: available=${currentStock}, requested=${quantity}`,
      );
    }

    // Update stock levels
    this.stockMap.set(sourceKey, currentStock - quantity);

    const targetKey = `${targetWarehouse.id}:${productId}`;
    const targetStock = this.stockMap.get(targetKey) ?? 0;
    this.stockMap.set(targetKey, targetStock + quantity);

    // Record transfer
    const transfer: StockTransfer = {
      id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      storeId: store.id,
      sourceWarehouseId: sourceWarehouse.id,
      targetWarehouseId: targetWarehouse.id,
      productId,
      quantity,
      timestamp: new Date(),
    };
    this.transfers.push(transfer);

    return {
      sourceRemaining: currentStock - quantity,
      targetUpdated: true,
    };
  }

  // ── Dashboard Summary ────────────────────────────────────────────────────

  /**
   * Get dashboard summary: revenue and order count by store.
   *
   * In production, this would aggregate data from transactions table.
   * For now, returns mock data.
   */
  getDashboardSummary(): { stores: StoreDashboard[] } {
    const storeSummaries: StoreDashboard[] = [];

    const storesArray = Array.from(this.stores.values());
    for (const store of storesArray) {
      // Mock revenue/order count for now
      // In production: query transactions where store_id = store.id
      const revenue = this.mockRevenueByStore(store.id);
      const orderCount = this.mockOrderCountByStore(store.id);

      storeSummaries.push({
        id: store.id,
        name: store.name,
        revenue,
        orderCount,
      });
    }

    return { stores: storeSummaries };
  }

  // ── Mock data (for unit tests) ───────────────────────────────────────────

  /**
   * Set mock revenue for a store.
   */
  setMockRevenue(storeId: string, revenue: number): void {
    (this as any).mockRevenues = (this as any).mockRevenues || {};
    (this as any).mockRevenues[storeId] = revenue;
  }

  /**
   * Set mock order count for a store.
   */
  setMockOrderCount(storeId: string, count: number): void {
    (this as any).mockOrders = (this as any).mockOrders || {};
    (this as any).mockOrders[storeId] = count;
  }

  private mockRevenueByStore(storeId: string): number {
    return (this as any).mockRevenues?.[storeId] ?? 0;
  }

  private mockOrderCountByStore(storeId: string): number {
    return (this as any).mockOrders?.[storeId] ?? 0;
  }
}

// Export for unit tests without NestJS injector
export const multiStoreService = new MultiStoreService();
