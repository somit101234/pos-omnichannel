import { describe, it, expect, beforeEach } from 'vitest';
import { ReportsService } from './reports.service';

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

describe('ReportsService — Debug orderCount', () => {
  let svc: ReportsService;

  beforeEach(() => {
    svc = new ReportsService();
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

    console.log('todayTransactions:', dashboard.todayRevenue);
    console.log('orderCount type:', typeof dashboard.orderCount);
    console.log('orderCount value:', dashboard.orderCount);
    console.log('topProducts:', dashboard.topProducts);

    expect(dashboard.orderCount).toBe(2);
    expect(dashboard.todayRevenue).toBe(300000n);
  });
});
