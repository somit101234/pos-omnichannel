import { describe, it, expect, beforeEach } from 'vitest';
import { MultiStoreService } from './multi-store.service';

describe('MultiStoreService', () => {
  let service: MultiStoreService;

  beforeEach(() => {
    service = new MultiStoreService();
  });

  // ── AC1: Create store → 201 ──────────────────────────────────────────
  describe('createStore', () => {
    it('AC1: create store returns 201 with storeId', () => {
      const result = service.createStore({
        name: 'Store A',
        address: '123 Main St',
        ownerId: 'user_1',
      });

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Store A');
      expect(result.address).toBe('123 Main St');
    });

    it('AC1: store name is required', () => {
      expect(() => {
        service.createStore({ name: '', address: '123 Main St', ownerId: 'user_1' });
      }).toThrow('Store name is required');
    });

    it('AC1: cannot create duplicate store name', () => {
      service.createStore({ name: 'Store A', address: '123 Main St', ownerId: 'user_1' });
      expect(() => {
        service.createStore({ name: 'Store A', address: '456 Other St', ownerId: 'user_2' });
      }).toThrow('Store name already exists');
    });
  });

  // ── AC2: Warehouse per store: CRUD ────────────────────────────────────
  describe('warehouse CRUD', () => {
    beforeEach(() => {
      // Create a store first
      service.createStore({ name: 'Store A', address: '123 Main St', ownerId: 'user_1' });
    });

    it('AC2: create warehouse for store', () => {
      const warehouse = service.createWarehouse('Store A', {
        name: 'Warehouse A1',
        address: '789 Warehouse St',
      });

      expect(warehouse).toHaveProperty('id');
      expect(warehouse.name).toBe('Warehouse A1');
    });

    it('AC2: get warehouses by storeId', () => {
      service.createWarehouse('Store A', { name: 'W1', address: 'Add1' });
      service.createWarehouse('Store A', { name: 'W2', address: 'Add2' });

      const warehouses = service.getWarehouses('Store A');
      expect(warehouses).toHaveLength(2);
    });

    it('AC2: throw if warehouse name duplicate in same store', () => {
      service.createWarehouse('Store A', { name: 'W1', address: 'Add1' });
      expect(() => {
        service.createWarehouse('Store A', { name: 'W1', address: 'Add2' });
      }).toThrow('Warehouse name already exists in this store');
    });
  });

  // ── AC3: Stock transfer: auto-update both warehouses ──────────────────
  describe('transferStock', () => {
    let sourceWarehouseId: string;
    let targetWarehouseId: string;

    beforeEach(() => {
      service.createStore({ name: 'Store A', address: '123 Main St', ownerId: 'user_1' });
      const sourceWh = service.createWarehouse('Store A', { name: 'Source W', address: 'Source Add' });
      const targetWh = service.createWarehouse('Store A', { name: 'Target W', address: 'Target Add' });
      sourceWarehouseId = sourceWh.id;
      targetWarehouseId = targetWh.id;
      // Register initial stock for testing
      service.registerStock(sourceWarehouseId, 'Product A', 100);
      service.registerStock(targetWarehouseId, 'Product A', 50);
    });

    it('AC3: transfer decreases source, increases target', () => {
      const result = service.transferStock('Store A', 'Source W', 'Target W', 'Product A', 10);

      expect(result.sourceRemaining).toBe(90);
      expect(result.targetUpdated).toBe(true);
    });

    it('AC3: cannot transfer more than available', () => {
      expect(() => {
        service.transferStock('Store A', 'Source W', 'Target W', 'Product A', 9999);
      }).toThrow('Insufficient stock in source warehouse: available=100, requested=9999');
    });
  });

  // ── AC4: Dashboard summary: revenue & order count by store ────────────
  describe('getDashboardSummary', () => {
    it('AC4: returns revenue by store', () => {
      const summary = service.getDashboardSummary();
      expect(summary).toHaveProperty('stores');
    });

    it('AC4: stores array includes name and id', () => {
      service.createStore({ name: 'Store A', address: '123 Main St', ownerId: 'user_1' });
      const summary = service.getDashboardSummary();

      const storeA = summary.stores.find(s => s.name === 'Store A');
      expect(storeA).toBeDefined();
      expect(storeA).toHaveProperty('id');
      expect(storeA).toHaveProperty('revenue');
      expect(storeA).toHaveProperty('orderCount');
    });

    it('AC4: empty stores returns empty array', () => {
      const summary = service.getDashboardSummary();
      expect(summary.stores).toHaveLength(0);
    });
  });
});
