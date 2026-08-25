import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsService } from './reports.service';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Register a product with given cost and sale price (in cents). */
function registerProduct(
  svc: ReportsService,
  id: string,
  name: string,
  costCents: bigint,
  saleCents: bigint,
  unit = 'item',
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
  items?: { productId: string; quantity: number; price: bigint }[],
): string {
  const txId = `tx_${date.getTime()}_${Math.random().toString(36).substring(2, 8)}`;
  (svc as any).testTransactions.set(txId, {
    id: txId,
    storeId,
    total,
    createdAt: date,
    platformFeeRate,
    items,
  });
  return txId;
}

// ── Mock PrismaService ──────────────────────────────────────────────────────

const mockPrisma = {
  transaction: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  product: {
    findUnique: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('ReportsService — Dashboard & Revenue/Profit Reports', () => {
  let svc: ReportsService;

  beforeEach(() => {
    svc = new ReportsService(mockPrisma as any);
  });

  // ================================================================
  // Test 1: Dashboard KPIs — Today Revenue, Order Count, Top 5 Products
  // ================================================================
  describe('Test 1 — Dashboard KPIs', () => {
    it('should calculate today revenue from transactions', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 500000n,
          createdAt: today,
          platformFeeRate: 0.15,
          transactionItems: [{ productId: 'p1', quantity: 1, price: 500000n }],
        },
        {
          id: 'tx2',
          storeId: 'store_1',
          total: 600000n,
          createdAt: today,
          platformFeeRate: 0.15,
          transactionItems: [{ productId: 'p2', quantity: 2, price: 300000n }],
        },
        {
          id: 'tx3',
          storeId: 'store_1',
          total: 400000n,
          createdAt: today,
          platformFeeRate: 0.15,
          transactionItems: [{ productId: 'p3', quantity: 1, price: 400000n }],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.product.findUnique.mockResolvedValue({ name: 'Product A' });

      const dashboard = await svc.getDashboardKpis('store_1', today);

      expect(dashboard.todayRevenue).toBe(1500000n);
    });

    it('should count today\'s orders correctly', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 100000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [],
        },
        {
          id: 'tx2',
          storeId: 'store_1',
          total: 200000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [],
        },
      ];

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const mockYesterdayTransaction = {
        id: 'tx3',
        storeId: 'store_1',
        total: 300000n,
        createdAt: yesterday,
        platformFeeRate: 0,
        transactionItems: [],
      };

      mockPrisma.transaction.findMany.mockImplementation(({ where }) => {
        const isToday = where.createdAt?.gte && where.createdAt?.lte;
        if (isToday) {
          return mockTransactions;
        }
        return [mockYesterdayTransaction];
      });
      mockPrisma.product.findUnique.mockResolvedValue({ name: 'Product A' });

      const dashboard = await svc.getDashboardKpis('store_1', today);

      expect(dashboard.orderCount).toBe(2);
    });

    it('should return top 5 products by sales', async () => {
      registerProduct(svc, 'p1', 'Product A', 10000n, 20000n);
      registerProduct(svc, 'p2', 'Product B', 20000n, 30000n);
      registerProduct(svc, 'p3', 'Product C', 5000n, 15000n);
      registerProduct(svc, 'p4', 'Product D', 15000n, 25000n);
      registerProduct(svc, 'p5', 'Product E', 8000n, 18000n);
      registerProduct(svc, 'p6', 'Product F', 12000n, 22000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 20000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [{ productId: 'p1', quantity: 1, price: 20000n }],
        },
        {
          id: 'tx2',
          storeId: 'store_1',
          total: 60000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [{ productId: 'p2', quantity: 2, price: 30000n }],
        },
        {
          id: 'tx3',
          storeId: 'store_1',
          total: 15000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [{ productId: 'p3', quantity: 1, price: 15000n }],
        },
        {
          id: 'tx4',
          storeId: 'store_1',
          total: 25000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [{ productId: 'p4', quantity: 1, price: 25000n }],
        },
        {
          id: 'tx5',
          storeId: 'store_1',
          total: 18000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [{ productId: 'p5', quantity: 1, price: 18000n }],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.product.findUnique.mockImplementation(({ where: { id } }) => {
        const names: Record<string, string> = {
          p1: 'Product A',
          p2: 'Product B',
          p3: 'Product C',
          p4: 'Product D',
          p5: 'Product E',
        };
        return { name: names[id] || 'Unknown' };
      });

      const dashboard = await svc.getDashboardKpis('store_1', today);

      expect(dashboard.topProducts.length).toBe(5);
      expect(dashboard.topProducts[0].productId).toBe('p2');
      expect(dashboard.topProducts[0].quantity).toBe(2);
    });
  });

  // ================================================================
  // Test 2: Revenue Report — Filter by Date Range
  // ================================================================
  describe('Test 2 — Revenue Report by Date Range', () => {
    it('should calculate revenue for today (day filter)', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 1000000n,
          createdAt: today,
          platformFeeRate: 0.15,
          transactionItems: [],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const report = await svc.getRevenueReport('store_1', {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        period: 'day',
      });

      expect(report.totalRevenue).toBe(1000000n);
      expect(report.period).toBe('day');
    });

    it('should aggregate weekly revenue correctly', async () => {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 500000n,
          createdAt: now,
          platformFeeRate: 0.15,
          transactionItems: [],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const report = await svc.getRevenueReport('store_1', {
        startDate: startOfWeek,
        endDate: now,
        period: 'week',
      });

      expect(report.totalRevenue).toBe(500000n);
      expect(report.period).toBe('week');
    });

    it('should aggregate monthly revenue correctly', async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 3000000n,
          createdAt: now,
          platformFeeRate: 0.15,
          transactionItems: [],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const report = await svc.getRevenueReport('store_1', {
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
    it('should calculate profit = revenue - cost - platformFee', async () => {
      registerProduct(svc, 'p1', 'Product A', 10000n, 20000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 20000n,
          createdAt: today,
          platformFeeRate: 0.15,
          transactionItems: [{ productId: 'p1', quantity: 1, price: 20000n }],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.product.findUnique.mockResolvedValue({ costPrice: 10000n });

      const profitReport = await svc.getProfitReport('store_1', {
        startDate: today,
        endDate: today,
        period: 'day',
      });

      expect(profitReport.totalRevenue).toBe(20000n);
      expect(profitReport.totalPlatformFee).toBe(3000n);
      expect(profitReport.totalCost).toBe(10000n);
      expect(profitReport.totalProfit).toBe(7000n);
    });

    it('should handle zero platform fee', async () => {
      registerProduct(svc, 'p1', 'Product A', 5000n, 15000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 15000n,
          createdAt: today,
          platformFeeRate: 0,
          transactionItems: [{ productId: 'p1', quantity: 1, price: 15000n }],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.product.findUnique.mockResolvedValue({ costPrice: 5000n });

      const profitReport = await svc.getProfitReport('store_1', {
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
    it('should generate Excel file with revenue data', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 1000000n,
          createdAt: today,
          platformFeeRate: 0.15,
          transactionItems: [],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);

      const excelBuffer = await svc.exportRevenueToExcel('store_1', {
        startDate: today,
        endDate: today,
        period: 'day',
      });

      expect(excelBuffer).toBeDefined();
      expect(excelBuffer.length).toBeGreaterThan(0);
      expect(String.fromCharCode(excelBuffer[0], excelBuffer[1])).toBe('PK');
    });

    it('should generate Excel file with profit data', async () => {
      registerProduct(svc, 'p1', 'Product A', 10000n, 20000n);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const mockTransactions = [
        {
          id: 'tx1',
          storeId: 'store_1',
          total: 20000n,
          createdAt: today,
          platformFeeRate: 0.15,
          transactionItems: [{ productId: 'p1', quantity: 1, price: 20000n }],
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
      mockPrisma.product.findUnique.mockResolvedValue({ costPrice: 10000n });

      const excelBuffer = await svc.exportProfitToExcel('store_1', {
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
