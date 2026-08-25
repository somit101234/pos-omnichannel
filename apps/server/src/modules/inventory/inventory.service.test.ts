import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockDbCalls: any[] = [];

  beforeEach(() => {
    mockDbCalls = [];

    const mockDb = {
      stock: {
        upsert: (args: any) => {
          mockDbCalls.push({ method: 'upsert', args });
          return Promise.resolve({
            productId: args.create?.productId,
            warehouseId: args.create?.warehouseId,
            quantity: args.update?.quantity ?? args.create?.quantity,
            lastUpdated: new Date(),
          });
        },
        findUnique: (args: any) => {
          mockDbCalls.push({ method: 'findUnique', args });
          return Promise.resolve((mockDb.stock as any)._findUniqueResult || null);
        },
        update: (args: any) => {
          mockDbCalls.push({ method: 'update', args });
          return Promise.resolve({
            productId: args.where.productId_warehouseId.productId,
            warehouseId: args.where.productId_warehouseId.warehouseId,
            quantity: args.data.quantity,
            lastUpdated: new Date(),
          });
        },
      },
      product: {
        update: (args: any) => {
          mockDbCalls.push({ method: 'product.update', args });
          return Promise.resolve({ id: args.where.id });
        },
      },
    };

    service = new InventoryService(mockDb);
  });

  // ── AC1: variance = theoretical - actual ─────────────────────────────
  describe('calculateVariance', () => {
    it('AC1: variance = theoretical - actual (deficit: theoretical > actual)', () => {
      const result = service.calculateVariance(50, 48, 10000n);
      expect(result.variance).toBe(2); // 50 - 48 = 2
    });

    it('AC1: variance = theoretical - actual (surplus: actual > theoretical)', () => {
      const result = service.calculateVariance(48, 50, 10000n);
      expect(result.variance).toBe(-2); // 48 - 50 = -2
    });

    it('AC1: variance = theoretical - actual (balanced)', () => {
      const result = service.calculateVariance(50, 50, 10000n);
      expect(result.variance).toBe(0); // 50 - 50 = 0
    });

    it('AC1: variance = theoretical - actual (zero quantity)', () => {
      const result = service.calculateVariance(0, 0, 10000n);
      expect(result.variance).toBe(0);
    });

    it('AC1: large numbers', () => {
      const result = service.calculateVariance(1000000, 999999, 10000n);
      expect(result.variance).toBe(1);
    });
  });

  // ── AC2: loss cost = |variance| × unit_cost (service: when variance > 0) ──
  describe('lossCost calculation', () => {
    it('AC2: loss cost calculated when variance > 0 (deficit)', () => {
      const result = service.calculateVariance(50, 48, 10000n);
      expect(result.variance).toBe(2);
      expect(result.lossCost).toBe(20000n); // 2 * 10000
    });

    it('AC2: no loss cost when variance <= 0 (surplus or balanced)', () => {
      const result = service.calculateVariance(48, 50, 10000n);
      expect(result.lossCost).toBe(0n);
    });

    it('AC2: loss cost = 0 when variance = 0', () => {
      const result = service.calculateVariance(50, 50, 10000n);
      expect(result.lossCost).toBe(0n);
    });

    it('AC2: loss cost with different unit cost', () => {
      const result = service.calculateVariance(100, 90, 5000n);
      expect(result.variance).toBe(10);
      expect(result.lossCost).toBe(50000n); // 10 * 5000
    });

    it('AC2: loss cost with zero unit cost', () => {
      const result = service.calculateVariance(50, 48, 0n);
      expect(result.lossCost).toBe(0n);
    });

    it('AC2: large loss cost', () => {
      const result = service.calculateVariance(1000, 0, 999999n);
      expect(result.variance).toBe(1000);
      expect(result.lossCost).toBe(999999000n); // 1000 * 999999
    });
  });

  // ── AC3: stock deduction after POS transaction ───────────────────────
  describe('autoDecreaseStock', () => {
    const productId = 'p1';
    const warehouseId = 'w1';

    it('AC3: deducts correct quantity from stock', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 100,
        lastUpdated: new Date(),
      };

      const result = await service.autoDecreaseStock(productId, warehouseId, 5);
      expect(result.quantity).toBe(95);
      expect(mockDbCalls.find((c) => c.method === 'update')).toBeDefined();
    });

    it('AC3: deducts 1 (single unit)', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 100,
        lastUpdated: new Date(),
      };

      const result = await service.autoDecreaseStock(productId, warehouseId, 1);
      expect(result.quantity).toBe(99);
    });

    it('AC3: stock reaches zero', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 5,
        lastUpdated: new Date(),
      };

      const result = await service.autoDecreaseStock(productId, warehouseId, 5);
      expect(result.quantity).toBe(0);
    });

    it('AC3: zero quantity deduction is no-op', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 100,
        lastUpdated: new Date(),
      };

      const result = await service.autoDecreaseStock(productId, warehouseId, 0);
      expect(result.quantity).toBe(100);
    });

    it('AC3: throws when stock is insufficient', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 10,
        lastUpdated: new Date(),
      };

      await expect(service.autoDecreaseStock(productId, warehouseId, 15)).rejects.toThrow(
        'Insufficient stock',
      );
    });

    it('AC3: throws when stock is zero', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 0,
        lastUpdated: new Date(),
      };

      await expect(service.autoDecreaseStock(productId, warehouseId, 1)).rejects.toThrow(
        'Insufficient stock',
      );
    });

    it('AC3: throws on negative quantity', async () => {
      await expect(service.autoDecreaseStock(productId, warehouseId, -5)).rejects.toThrow(
        'non-negative',
      );
    });

    it('AC3: multiple sequential deductions', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 100,
        lastUpdated: new Date(),
      };

      await service.autoDecreaseStock(productId, warehouseId, 30); // 70 remaining
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 70,
        lastUpdated: new Date(),
      };
      await service.autoDecreaseStock(productId, warehouseId, 50); // 20 remaining
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 20,
        lastUpdated: new Date(),
      };
      const result = await service.autoDecreaseStock(productId, warehouseId, 20);
      expect(result.quantity).toBe(0);
    });

    it('AC3: throws on third deduction exceeding remaining stock', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 100,
        lastUpdated: new Date(),
      };

      await service.autoDecreaseStock(productId, warehouseId, 30); // 70 remaining
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 70,
        lastUpdated: new Date(),
      };
      await service.autoDecreaseStock(productId, warehouseId, 50); // 20 remaining
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 20,
        lastUpdated: new Date(),
      };
      await expect(service.autoDecreaseStock(productId, warehouseId, 25)).rejects.toThrow(
        'Insufficient stock',
      );
    });
  });

  // ── AC4: registerStock ───────────────────────────────────────────────
  describe('registerStock', () => {
    const productId = 'p1';
    const warehouseId = 'w1';

    it('AC4: creates new stock entry', async () => {
      await service.registerStock({ productId, warehouseId, quantity: 100 });

      const upsertCall = mockDbCalls.find((c) => c.method === 'upsert');
      expect(upsertCall).toBeDefined();
      expect(upsertCall?.args.create).toEqual({
        productId,
        warehouseId,
        quantity: 100,
      });
    });

    it('AC4: updates existing stock entry', async () => {
      await service.registerStock({ productId, warehouseId, quantity: 150 });

      const upsertCall = mockDbCalls.find((c) => c.method === 'upsert');
      expect(upsertCall?.args.update).toEqual({ quantity: 150 });
    });
  });

  // ── AC5: getStock ────────────────────────────────────────────────────
  describe('getStock', () => {
    const productId = 'p1';
    const warehouseId = 'w1';

    it('AC5: returns stock when exists', async () => {
      (service as any).db.stock._findUniqueResult = {
        productId,
        warehouseId,
        quantity: 100,
        lastUpdated: new Date(),
      };

      const result = await service.getStock(productId, warehouseId);
      expect(result).toEqual({ productId, warehouseId, quantity: 100 });
    });

    it('AC5: returns null when stock not found', async () => {
      delete (service as any).db.stock._findUniqueResult;
      const result = await service.getStock(productId, warehouseId);
      expect(result).toBeNull();
    });
  });
});
