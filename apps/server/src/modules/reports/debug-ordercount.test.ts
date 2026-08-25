import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReportsService } from './reports.service';

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

describe('ReportsService — Debug orderCount', () => {
  let svc: ReportsService;

  beforeEach(() => {
    svc = new ReportsService(mockPrisma as any);
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

    // Mock findMany to return mockTransactions for today, mockYesterdayTransaction for yesterday
    mockPrisma.transaction.findMany.mockImplementation(({ where }) => {
      if (where.createdAt?.lte && where.createdAt?.gte) {
        // Today filter
        return mockTransactions;
      }
      return [mockYesterdayTransaction];
    });
    mockPrisma.product.findUnique.mockResolvedValue({ name: 'Product A' });

    const dashboard = await svc.getDashboardKpis('store_1', today);

    console.log('todayTransactions:', dashboard.todayRevenue);
    console.log('orderCount type:', typeof dashboard.orderCount);
    console.log('orderCount value:', dashboard.orderCount);
    console.log('topProducts:', dashboard.topProducts);

    expect(dashboard.orderCount).toBe(2);
    expect(dashboard.todayRevenue).toBe(300000n);
  });
});
