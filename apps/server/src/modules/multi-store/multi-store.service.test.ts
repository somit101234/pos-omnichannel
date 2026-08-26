// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiStoreService } from './multi-store.service';

// ── Mock Prisma ─────────────────────────────────────────────────────────────

const mockStores = new Map<string, any>();
const mockWarehouses = new Map<string, any>();
const mockStocks = new Map<string, any>();
const mockTransactions: any[] = [];

const mockPrisma = {
  store: {
    findUnique: vi.fn(({ where: { id } }: any) => Promise.resolve(mockStores.get(id) || null)),
    findFirst: vi.fn(({ where }: any) => {
      // Case 1: where.name only
      if (where.name && !where.storeId) {
        for (const s of mockStores.values()) {
          if (s.name === where.name) return Promise.resolve(s);
        }
        return Promise.resolve(null);
      }
      // Case 2: where.id
      if (where.id) {
        return Promise.resolve(mockStores.get(where.id) || null);
      }
      return Promise.resolve(null);
    }),
    findMany: vi.fn(() => Promise.resolve(Array.from(mockStores.values()))),
    create: vi.fn(({ data }: any) => {
      const id = data.id || `store_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storedData = { ...data, id, created_AT: new Date(), updated_AT: new Date() };
      mockStores.set(id, storedData);
      return Promise.resolve(storedData);
    }),
    update: vi.fn(({ where, data }: any) => {
      const existing = mockStores.get(where.id);
      const updated = { ...existing, ...data };
      mockStores.set(where.id, updated);
      return Promise.resolve(updated);
    }),
  },
  warehouse: {
    findUnique: vi.fn(({ where: { id } }: any) => Promise.resolve(mockWarehouses.get(id) || null)),
    findFirst: vi.fn(({ where }: any) => {
      // Case 1: where.storeId + where.name (tìm trong store)
      if (where.storeId && where.name) {
        for (const w of mockWarehouses.values()) {
          if (w.storeId === where.storeId && w.name === where.name) return Promise.resolve(w);
        }
        return Promise.resolve(null);
      }
      // Case 2: where.id
      if (where.id) {
        return Promise.resolve(mockWarehouses.get(where.id) || null);
      }
      // Case 3: where.storeId (tìm tất cả warehouses của store)
      if (where.storeId) {
        const result = Array.from(mockWarehouses.values()).filter((w) => w.storeId === where.storeId);
        return Promise.resolve(result.length > 0 ? result[0] : null);
      }
      return Promise.resolve(null);
    }),
    findMany: vi.fn(({ where: { storeId } }: any) =>
      Promise.resolve(Array.from(mockWarehouses.values()).filter((w) => w.storeId === storeId))
    ),
    create: vi.fn(({ data }: any) => {
      const id = data.id || `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const storedData = { ...data, id, created_AT: new Date(), updated_AT: new Date() };
      mockWarehouses.set(id, storedData);
      return Promise.resolve(storedData);
    }),
    update: vi.fn(),
  },
  stock: {
    findUnique: vi.fn(({ where: { warehouseId_productId } }: any) =>
      Promise.resolve(mockStocks.get(`${warehouseId_productId.warehouseId}_${warehouseId_productId.productId}`) || null)
    ),
    findFirst: vi.fn(),
    upsert: vi.fn(({ where, update, create }: any) => {
      // where: { warehouseId_productId: { warehouseId, productId } }
      const key = `${where.warehouseId_productId.warehouseId}_${where.warehouseId_productId.productId}`;
      const combined = { ...create, ...update, id: key };
      mockStocks.set(key, combined);
      return Promise.resolve(combined);
    }),
    update: vi.fn(({ where, data }: any) => {
      const key = `${where.warehouseId_productId.warehouseId}_${where.warehouseId_productId.productId}`;
      const existing = mockStocks.get(key);
      if (existing) {
        const updated = { ...existing, ...data };
        mockStocks.set(key, updated);
        return Promise.resolve(updated);
      }
      return Promise.resolve(null);
    }),
  },
  transaction: {
    create: vi.fn(({ data }: any) => {
      mockTransactions.push(data);
      return Promise.resolve(data);
    }),
  },
  $transaction: vi.fn((callback: any) => callback({ stock: mockPrisma.stock, transaction: mockPrisma.transaction })),
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function createStore(service: MultiStoreService, dto: any) {
  return service.createStore(dto);
}

async function getStoreByName(service: MultiStoreService, name: string) {
  return service.getStoreByName(name);
}

async function createWarehouse(service: MultiStoreService, storeName: string, dto: any) {
  return service.createWarehouse(storeName, dto);
}

async function registerStock(service: MultiStoreService, warehouseId: string, productId: string, quantity: number) {
  return service.registerStock(warehouseId, productId, quantity);
}

async function transferStock(service: MultiStoreService, storeName: string, sourceWh: string, targetWh: string, productId: string, quantity: number) {
  return service.transferStock(storeName, sourceWh, targetWh, productId, quantity);
}

async function expectThrow(fn: () => unknown, substring: string): Promise<void> {
  let caught = false;
  let actualMsg = '';
  try {
    const result = fn();
    if (result instanceof Promise) await result;
  } catch (e: any) {
    caught = true;
    actualMsg = e.message || String(e);
  }
  expect(caught).toBe(true);
  expect(actualMsg).toContain(substring);
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('MultiStoreService — Prisma Integration', () => {
  let service: MultiStoreService;

  beforeEach(() => {
    mockStores.clear();
    mockWarehouses.clear();
    mockStocks.clear();
    mockTransactions.length = 0;
    vi.clearAllMocks();
    service = new MultiStoreService(mockPrisma as any);
  });

  // ================================================================
  // Test 1: Store CRUD
  // ================================================================
  describe('Test 1 — Store CRUD', () => {
    it('should create a new store', async () => {
      const store = await createStore(service, {
        name: 'Store A',
        address: '123 Main St',
        ownerId: 'owner_1',
      });

      expect(store).toBeDefined();
      expect(store.name).toBe('Store A');
      expect(store.ownerId).toBe('owner_1');
    });

    it('should reject duplicate store name', async () => {
      await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      await expectThrow(
        () => createStore(service, { name: 'Store A', address: '456 Side St', ownerId: 'owner_2' }),
        'Store name already exists'
      );
    });

    it('should reject empty store name', async () => {
      await expectThrow(
        () => createStore(service, { name: '', address: '123 Main St', ownerId: 'owner_1' }),
        'Store name is required'
      );
    });

    it('should get all stores', async () => {
      await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      await createStore(service, { name: 'Store B', address: '456 Side St', ownerId: 'owner_2' });

      const stores = await service.getStores();
      expect(stores.length).toBe(2);
    });

    it('should get store by ID', async () => {
      const created = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const found = await service.getStoreById(created.id);

      expect(found?.name).toBe('Store A');
    });

    it('should update store', async () => {
      const created = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const updated = await service.updateStore(created.id, { name: 'Store A Updated', address: '789 New St' });

      expect(updated.name).toBe('Store A Updated');
      expect(updated.address).toBe('789 New St');
    });

    it('should get store by name', async () => {
      await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const found = await service.getStoreByName('Store A');

      expect(found?.name).toBe('Store A');
    });
  });

  // ================================================================
  // Test 2: Warehouse CRUD
  // ================================================================
  describe('Test 2 — Warehouse CRUD', () => {
    it('should create warehouse for existing store', async () => {
      const store = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const warehouse = await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Warehouse Address' });

      expect(warehouse.storeId).toBe(store.id);
      expect(warehouse.name).toBe('WH1');
    });

    it('should reject warehouse with duplicate name in same store', async () => {
      await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr' });
      await expectThrow(
        () => createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr2' }),
        'Warehouse name already exists'
      );
    });

    it('should get warehouses by store', async () => {
      await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr1' });
      await createWarehouse(service, 'Store A', { name: 'WH2', address: 'Addr2' });

      const warehouses = await service.getWarehouses('Store A');
      expect(warehouses.length).toBe(2);
    });

    it('should get warehouse by ID', async () => {
      const store = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const created = await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr' });
      const found = await service.getWarehouseById(created.id);

      expect(found?.name).toBe('WH1');
    });
  });

  // ================================================================
  // Test 3: Stock operations
  // ================================================================
  describe('Test 3 — Stock operations', () => {
    it('should register stock', async () => {
      const store = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const warehouse = await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr' });

      await registerStock(service, warehouse.id, 'product_1', 100);

      const stock = await service.getStock(warehouse.id, 'product_1');
      expect(stock).toBe(100);
    });

    it('should update existing stock', async () => {
      const store = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const warehouse = await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr' });

      await registerStock(service, warehouse.id, 'product_1', 100);
      await registerStock(service, warehouse.id, 'product_1', 200);

      const stock = await service.getStock(warehouse.id, 'product_1');
      expect(stock).toBe(200);
    });

    it('should transfer stock between warehouses', async () => {
      const store = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const wh1 = await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr1' });
      const wh2 = await createWarehouse(service, 'Store A', { name: 'WH2', address: 'Addr2' });

      await registerStock(service, wh1.id, 'product_1', 100);
      await registerStock(service, wh2.id, 'product_1', 50);

      const result = await transferStock(service, 'Store A', 'WH1', 'WH2', 'product_1', 30);

      expect(result.sourceRemaining).toBe(70);
      expect(result.targetUpdated).toBe(true);

      const stockWh1 = await service.getStock(wh1.id, 'product_1');
      const stockWh2 = await service.getStock(wh2.id, 'product_1');

      expect(stockWh1).toBe(70);
      expect(stockWh2).toBe(80);
    });

    it('should throw on insufficient stock', async () => {
      const store = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const wh1 = await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr1' });
      const wh2 = await createWarehouse(service, 'Store A', { name: 'WH2', address: 'Addr2' });

      await registerStock(service, wh1.id, 'product_1', 50);

      await expectThrow(
        () => transferStock(service, 'Store A', 'WH1', 'WH2', 'product_1', 100),
        'Insufficient stock'
      );
    });

    it('should create transaction on stock transfer', async () => {
      const store = await createStore(service, { name: 'Store A', address: '123 Main St', ownerId: 'owner_1' });
      const wh1 = await createWarehouse(service, 'Store A', { name: 'WH1', address: 'Addr1' });
      const wh2 = await createWarehouse(service, 'Store A', { name: 'WH2', address: 'Addr2' });

      await registerStock(service, wh1.id, 'product_1', 100);
      await transferStock(service, 'Store A', 'WH1', 'WH2', 'product_1', 30);

      const tx = mockTransactions.find((t) => t.type === 'TRANSFER');
      expect(tx).toBeDefined();
      expect(tx.status).toBe('COMPLETED');
    });
  });
});
