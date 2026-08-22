import { describe, it, expect, beforeEach } from 'vitest';
import { ReportsService } from './reports.service';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Register a product with given cost and sale price (in cents). */
function registerProduct(
  svc: ReportsService,
  id: string,
  name: string,
  costCents: bigint,
  saleCents: bigint,
  unit = 'item'
): void {
  svc.registerProduct({
    id,
    name,
    costPrice: costCents,
    salePrice: saleCents,
    unit,
  });
}

/** Create a transaction with a specific date. */
function createTransactionWithDate(
  svc: ReportsService,
  storeId: string,
  total: bigint,
  date: Date,
  platformFeeRate: number = 0,
  items?: { productId: string; quantity: number; price: bigint }[]
): string {
  const txId = `tx_${date.getTime()}_${Math.random().toString(36).substring(2, 8)}`;
  (svc as any).transactions.set(txId, {
    id: txId,
    storeId,
    total,
    createdAt: date,
    platformFeeRate,
    items,
  });
  return txId;
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('ReportsService — Dashboard & Revenue/Profit Reports', () => {
  let svc: ReportsService;

  beforeEach(() => {
    svc = new ReportsService();
  });

  // ================================================================
  // Test 1: Dashboard KPIs — Today Revenue, Order Count, Top 5 Products
  // ================================================================
  describe('Test 1 — Dashboard KPIs', () => {
    it('should calculate today revenue from transactions', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tx1 = createTransactionWithDate(svc, 'store_1', 500000n, today, 0.15, [
        { productId: 'p1', quantity: 1, price: 500000n },
      ]);
      const tx2 = createTransactionWithDate(svc, 'store_1', 600000n, today, 0.15, [
        { productId: 'p2', quantity: 2, price: 300000n },
      ]);
      const tx3 = createTransactionWithDate(svc, 'store_1', 400000n, today, 0.15, [
        { productId: 'p3', quantity: 1, price: 400000n },
      ]);

      const dashboard = svc.getDashboardKpis('store_1', today);

      expect(dashboard.todayRevenue).toBe(1500000n);
    });

    it('should count today\'s orders correctly', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      createTransactionWithDate(svc, 'store_1', 100000n, today, 0);
      createTransactionWithDate(svc, 'store_1', 200000n, today, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      createTransactionWithDate(svc, 'store_1', 300000n, yesterday, 0);

      const dashboard = svc.getDashboardKpis('store_1', today);

      expect(dashboard.orderCount).toBe(2);
    });

    it('should return top 5 products by sales', () => {
      registerProduct(svc, 'p1', 'Product A', 10000n, 20000n);
      registerProduct(svc, 'p2', 'Product B', 20000n, 30000n);
      registerProduct(svc, 'p3', 'Product C', 5000n, 15000n);
      registerProduct(svc, 'p4', 'Product D', 15000n, 25000n);
      registerProduct(svc, 'p5', 'Product E', 8000n, 18000n);
      registerProduct(svc, 'p6', 'Product F', 12000n, 22000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      createTransactionWithDate(svc, 'store_1', 20000n, today, 0, [
        { productId: 'p1', quantity: 1, price: 20000n },
      ]);
      createTransactionWithDate(svc, 'store_1', 60000n, today, 0, [
        { productId: 'p2', quantity: 2, price: 30000n },
      ]);
      createTransactionWithDate(svc, 'store_1', 15000n, today, 0, [
        { productId: 'p3', quantity: 1, price: 15000n },
      ]);
      createTransactionWithDate(svc, 'store_1', 25000n, today, 0, [
        { productId: 'p4', quantity: 1, price: 25000n },
      ]);
      createTransactionWithDate(svc, 'store_1', 18000n, today, 0, [
        { productId: 'p5', quantity: 1, price: 18000n },
      ]);

      const dashboard = svc.getDashboardKpis('store_1', today);

      expect(dashboard.topProducts.length).toBe(5);
      expect(dashboard.topProducts[0].productId).toBe('p2');
      expect(dashboard.topProducts[0].quantity).toBe(2);
    });
  });

  // ================================================================
  // Test 2: Revenue Report — Filter by Date Range
  // ================================================================
  describe('Test 2 — Revenue Report by Date Range', () => {
    it('should calculate revenue for today (day filter)', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      createTransactionWithDate(svc, 'store_1', 1000000n, today, 0.15);

      const report = svc.getRevenueReport('store_1', {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        period: 'day',
      });

      expect(report.totalRevenue).toBe(1000000n);
      expect(report.period).toBe('day');
    });

    it('should aggregate weekly revenue correctly', () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);

      createTransactionWithDate(svc, 'store_1', 500000n, now, 0.15);

      const report = svc.getRevenueReport('store_1', {
        startDate: startOfWeek,
        endDate: now,
        period: 'week',
      });

      expect(report.totalRevenue).toBe(500000n);
      expect(report.period).toBe('week');
    });

    it('should aggregate monthly revenue correctly', () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      createTransactionWithDate(svc, 'store_1', 3000000n, now, 0.15);

      const report = svc.getRevenueReport('store_1', {
        startDate: startOfMonth,
        endDate: now,
        period: 'month',
      });

      expect(report.totalRevenue).toBe(3000000n);
      expect(report.period).toBe('month');
    });
  });

  // ================================================================
  // Test 3: Profit Report — Revenue - Cost (BOM) - Platform Fee
  // ================================================================
  describe('Test 3 — Profit Report', () => {
    it('should calculate profit = revenue - cost - platformFee', () => {
      registerProduct(svc, 'p1', 'Product A', 10000n, 20000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      createTransactionWithDate(svc, 'store_1', 20000n, today, 0.15, [
        { productId: 'p1', quantity: 1, price: 20000n },
      ]);

      const profitReport = svc.getProfitReport('store_1', {
        startDate: today,
        endDate: today,
        period: 'day',
      });

      expect(profitReport.totalRevenue).toBe(20000n);
      expect(profitReport.totalPlatformFee).toBe(3000n);
      expect(profitReport.totalCost).toBe(10000n);
      expect(profitReport.totalProfit).toBe(7000n);
    });

    it('should handle zero platform fee', () => {
      registerProduct(svc, 'p1', 'Product A', 5000n, 15000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      createTransactionWithDate(svc, 'store_1', 15000n, today, 0, [
        { productId: 'p1', quantity: 1, price: 15000n },
      ]);

      const profitReport = svc.getProfitReport('store_1', {
        startDate: today,
        endDate: today,
        period: 'day',
      });

      expect(profitReport.totalRevenue).toBe(15000n);
      expect(profitReport.totalPlatformFee).toBe(0n);
      expect(profitReport.totalCost).toBe(5000n);
      expect(profitReport.totalProfit).toBe(10000n);
    });
  });

  // ================================================================
  // Test 4: Excel Export — Generate .xlsx file
  // ================================================================
  describe('Test 4 — Excel Export', () => {
    it('should generate Excel file with revenue data', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      createTransactionWithDate(svc, 'store_1', 1000000n, today, 0.15);

      const excelBuffer = svc.exportRevenueToExcel('store_1', {
        startDate: today,
        endDate: today,
        period: 'day',
      });

      expect(excelBuffer).toBeDefined();
      expect(excelBuffer.length).toBeGreaterThan(0);
      expect(String.fromCharCode(excelBuffer[0], excelBuffer[1])).toBe('PK');
    });

    it('should generate Excel file with profit data', () => {
      registerProduct(svc, 'p1', 'Product A', 10000n, 20000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      createTransactionWithDate(svc, 'store_1', 20000n, today, 0.15, [
        { productId: 'p1', quantity: 1, price: 20000n },
      ]);

      const excelBuffer = svc.exportProfitToExcel('store_1', {
        startDate: today,
        endDate: today,
        period: 'day',
      });

      expect(excelBuffer).toBeDefined();
      expect(excelBuffer.length).toBeGreaterThan(0);
      expect(String.fromCharCode(excelBuffer[0], excelBuffer[1])).toBe('PK');
    });
  });
});
