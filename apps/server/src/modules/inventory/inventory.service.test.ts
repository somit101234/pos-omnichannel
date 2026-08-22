import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService();
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
      // Service: variance > 0 → lossCost = variance * unitCost
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
    it('AC3: deducts correct quantity from stock', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 100 };
      service.autoDecreaseStock(stock, 5);
      expect(stock.quantity).toBe(95);
    });

    it('AC3: deducts 1 (single unit)', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 100 };
      service.autoDecreaseStock(stock, 1);
      expect(stock.quantity).toBe(99);
    });

    it('AC3: stock reaches zero', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 5 };
      service.autoDecreaseStock(stock, 5);
      expect(stock.quantity).toBe(0);
    });

    it('AC3: zero quantity deduction is no-op', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 100 };
      service.autoDecreaseStock(stock, 0);
      expect(stock.quantity).toBe(100);
    });

    it('AC3: throws when stock is insufficient', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 10 };
      expect(() => service.autoDecreaseStock(stock, 15)).toThrow('Insufficient stock');
    });

    it('AC3: throws when stock is zero', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 0 };
      expect(() => service.autoDecreaseStock(stock, 1)).toThrow('Insufficient stock');
    });

    it('AC3: throws on negative quantity', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 100 };
      expect(() => service.autoDecreaseStock(stock, -5)).toThrow('non-negative');
    });

    it('AC3: multiple sequential deductions', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 100 };
      service.autoDecreaseStock(stock, 30);
      service.autoDecreaseStock(stock, 20);
      service.autoDecreaseStock(stock, 50);
      expect(stock.quantity).toBe(0);
    });

    it('AC3: throws on third deduction exceeding remaining stock', () => {
      const stock = { productId: 'p1', warehouseId: 'w1', quantity: 100 };
      service.autoDecreaseStock(stock, 30); // 70 remaining
      service.autoDecreaseStock(stock, 50); // 20 remaining
      expect(() => service.autoDecreaseStock(stock, 25)).toThrow('Insufficient stock');
    });
  });
});
