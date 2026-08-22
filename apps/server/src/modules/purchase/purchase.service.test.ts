import { describe, it, expect, beforeEach } from 'vitest';
import { PurchaseService } from './purchase.service';

describe('PurchaseService - Weighted Average Cost', () => {
  let service: PurchaseService;

  beforeEach(() => {
    service = new PurchaseService();
  });

  // ===== AC: Weighted average cost formula =====
  // Weighted avg = (oldQty × oldCost + newQty × newCost) / (oldQty + newQty)

  describe('AC — Weighted average cost calculation', () => {
    it('should calculate weighted avg correctly: (10 × 10000 + 10 × 12000) / 20 = 11000', () => {
      const oldQty = 10n;
      const oldCost = 10000n;
      const newQty = 10n;
      const newCost = 12000n;

      const result = service.calculateWeightedAvgCost(oldQty, oldCost, newQty, newCost);

      expect(result).toBe(11000n);
    });

    it('should handle different quantities: (5 × 20000 + 15 × 18000) / 20 = 18500', () => {
      const oldQty = 5n;
      const oldCost = 20000n;
      const newQty = 15n;
      const newCost = 18000n;

      const result = service.calculateWeightedAvgCost(oldQty, oldCost, newQty, newCost);

      expect(result).toBe(18500n);
    });

    it('should handle zero old quantity: (0 × 10000 + 10 × 15000) / 10 = 15000', () => {
      const oldQty = 0n;
      const oldCost = 10000n;
      const newQty = 10n;
      const newCost = 15000n;

      const result = service.calculateWeightedAvgCost(oldQty, oldCost, newQty, newCost);

      expect(result).toBe(15000n);
    });

    it('should handle single unit receipt: (100 × 50000 + 1 × 55000) / 101 ≈ 50049', () => {
      const oldQty = 100n;
      const oldCost = 50000n;
      const newQty = 1n;
      const newCost = 55000n;

      const result = service.calculateWeightedAvgCost(oldQty, oldCost, newQty, newCost);

      expect(result).toBe(50049n); // (5000000 + 55000) / 101 = 50049.50... → 50049
    });

    it('should handle price decrease: (20 × 25000 + 20 × 20000) / 40 = 22500', () => {
      const oldQty = 20n;
      const oldCost = 25000n;
      const newQty = 20n;
      const newCost = 20000n;

      const result = service.calculateWeightedAvgCost(oldQty, oldCost, newQty, newCost);

      expect(result).toBe(22500n);
    });

    it('should match manual calculation: cháo ếch example', () => {
      // Ví dụ: 1 nồi cháo ếch có BOM: 0.5kg ếch, 0.3kg gạo
      // Lần 1: nhập 10 nồi @ 100,000đ/nồi
      // Lần 2: nhập 10 nồi @ 120,000đ/nồi
      // Giá vốn weighted avg = (10 × 100000 + 10 × 120000) / 20 = 110,000

      const oldQty = 10n;
      const oldCost = 100000n;
      const newQty = 10n;
      const newCost = 120000n;

      const result = service.calculateWeightedAvgCost(oldQty, oldCost, newQty, newCost);

      expect(result).toBe(110000n);
    });
  });
});
