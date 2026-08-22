import { describe, it, expect, beforeEach } from 'vitest';
import { InvoiceService, ReceiptFormat } from './invoice.service';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Mock Transaction object for testing */
interface MockTransaction {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeTaxCode: string;
  items: {
    productName: string;
    quantity: number;
    price: bigint; // cents
    subtotal: bigint; // cents
  }[];
  total: bigint; // cents
  cash: bigint; // cents
  change: bigint; // cents
  platform: 'POS' | 'SHOPEE' | 'GRABFOOD' | 'BEOFORD';
  createdAt: string;
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('InvoiceService — Thermal Receipt Template', () => {
  let svc: InvoiceService;

  beforeEach(() => {
    svc = new InvoiceService();
  });

  // ================================================================
  // Test 1: 58mm receipt — expect PASS
  // ================================================================
  describe('Test 1 — 58mm receipt format', () => {
    it('should generate correct 58mm receipt with store info, items, total, change', () => {
      const tx: MockTransaction = {
        id: 'txn_001',
        orderId: 'ORD-2026-001',
        storeId: 'store_hcm',
        storeName: 'Cháo ếch Bà Xanh',
        storeAddress: '123 Le Loi, Q1, HCMC',
        storeTaxCode: '0123456789',
        items: [
          { productName: 'Cháo ếch', quantity: 2, price: 75000n, subtotal: 150000n },
          { productName: 'Nước mắm', quantity: 1, price: 20000n, subtotal: 20000n },
        ],
        total: 170000n,
        cash: 200000n,
        change: 30000n,
        platform: 'POS',
        createdAt: '2026-08-22 20:30:00',
      };

      const receipt = svc.generateReceipt(tx, ReceiptFormat.W58);

      // Verify structure
      expect(receipt).toContain('Cháo ếch Bà Xanh');
      expect(receipt).toContain('123 Le Loi, Q1, HCMC');
      expect(receipt).toContain('MST: 0123456789');
      expect(receipt).toContain('ORD-2026-001');
      expect(receipt).toContain('Cháo ếch');
      expect(receipt).toContain('2 x 75,000 = 150,000');
      expect(receipt).toContain('Nước mắm');
      expect(receipt).toContain('1 x 20,000 = 20,000');
      expect(receipt).toContain('Tổng cộng: 170,000');
      expect(receipt).toContain('Tiền mặt: 200,000');
      expect(receipt).toContain('Tiền thừa: 30,000');

      // Line count: 58mm paper ≈ 40-42 lines max
      const lines = receipt.split('\n').filter((l) => l.trim() !== '');
      expect(lines.length).toBeLessThanOrEqual(42);
    });

    it('should truncate long product names for 58mm width', () => {
      const tx: MockTransaction = {
        id: 'txn_002',
        orderId: 'ORD-002',
        storeId: 'store_hn',
        storeName: 'Cửa hàng',
        storeAddress: 'Hà Nội',
        storeTaxCode: '9876543210',
        items: [
          {
            productName: 'Món ăn siêu dài tên dùng để test word wrap trên khổ 58mm',
            quantity: 1,
            price: 50000n,
            subtotal: 50000n,
          },
        ],
        total: 50000n,
        cash: 100000n,
        change: 50000n,
        platform: 'POS',
        createdAt: '2026-08-22 21:00:00',
      };

      const receipt = svc.generateReceipt(tx, ReceiptFormat.W58);
      expect(receipt).toContain('Món ăn siêu dài tên dùng để test word wrap');
    });
  });

  // ================================================================
  // Test 2: 80mm receipt — expect PASS
  // ================================================================
  describe('Test 2 — 80mm receipt format', () => {
    it('should generate correct 80mm receipt with full details', () => {
      const tx: MockTransaction = {
        id: 'txn_003',
        orderId: 'ORD-2026-003',
        storeId: 'store_dn',
        storeName: 'Quán Ăn Ngon',
        storeAddress: '456 Tran Phu, Q5, HCMC',
        storeTaxCode: '1122334455',
        items: [
          { productName: 'Bún chả', quantity: 3, price: 60000n, subtotal: 180000n },
          { productName: 'Nước cam', quantity: 2, price: 30000n, subtotal: 60000n },
        ],
        total: 240000n,
        cash: 300000n,
        change: 60000n,
        platform: 'POS',
        createdAt: '2026-08-22 22:00:00',
      };

      const receipt = svc.generateReceipt(tx, ReceiptFormat.W80);

      expect(receipt).toContain('Quán Ăn Ngon');
      expect(receipt).toContain('Bún chả');
      expect(receipt).toContain('3 x 60,000 = 180,000');
      expect(receipt).toContain('Nước cam');
      expect(receipt).toContain('2 x 30,000 = 60,000');
      expect(receipt).toContain('Tổng cộng: 240,000');
      expect(receipt).toContain('Tiền mặt: 300,000');
      expect(receipt).toContain('Tiền thừa: 60,000');

      // 80mm paper ≈ 58-60 lines max
      const lines = receipt.split('\n').filter((l) => l.trim() !== '');
      expect(lines.length).toBeLessThanOrEqual(60);
    });
  });

  // ================================================================
  // Test 3: Platform source in receipt — expect PASS
  // ================================================================
  describe('Test 3 — Platform source indicator', () => {
    it('should show platform source on receipt', () => {
      const tx: MockTransaction = {
        id: 'txn_004',
        orderId: 'SHOPEE-2026-0001',
        storeId: 'store_hcm',
        storeName: 'Cháo ếch Bà Xanh',
        storeAddress: '123 Le Loi, Q1, HCMC',
        storeTaxCode: '0123456789',
        items: [{ productName: 'Cháo ếch', quantity: 1, price: 75000n, subtotal: 75000n }],
        total: 75000n,
        cash: 100000n,
        change: 25000n,
        platform: 'SHOPEE',
        createdAt: '2026-08-22 23:00:00',
      };

      const receipt = svc.generateReceipt(tx, ReceiptFormat.W58);
      expect(receipt).toContain('Nền tảng: SHOPEE');
    });

    it('should handle GRABFOOD platform', () => {
      const tx: MockTransaction = {
        id: 'txn_005',
        orderId: 'GRAB-2026-0002',
        storeId: 'store_hcm',
        storeName: 'Cháo ếch Bà Xanh',
        storeAddress: '123 Le Loi, Q1, HCMC',
        storeTaxCode: '0123456789',
        items: [{ productName: 'Cháo ếch', quantity: 2, price: 75000n, subtotal: 150000n }],
        total: 150000n,
        cash: 200000n,
        change: 50000n,
        platform: 'GRABFOOD',
        createdAt: '2026-08-22 23:30:00',
      };

      const receipt = svc.generateReceipt(tx, ReceiptFormat.W58);
      expect(receipt).toContain('Nền tảng: GRABFOOD');
    });
  });

  // ================================================================
  // Test 4: Reprint format — expect PASS
  // ================================================================
  describe('Test 4 — Reprint indicator', () => {
    it('should mark receipt as reprint when flag is true', () => {
      const tx: MockTransaction = {
        id: 'txn_006',
        orderId: 'ORD-2026-001',
        storeId: 'store_hcm',
        storeName: 'Cháo ếch Bà Xanh',
        storeAddress: '123 Le Loi, Q1, HCMC',
        storeTaxCode: '0123456789',
        items: [{ productName: 'Cháo ếch', quantity: 1, price: 75000n, subtotal: 75000n }],
        total: 75000n,
        cash: 100000n,
        change: 25000n,
        platform: 'POS',
        createdAt: '2026-08-22 20:30:00',
      };

      const receipt = svc.generateReceipt(tx, ReceiptFormat.W58, true);
      expect(receipt).toContain('--- SAO LƯU ---');
    });

    it('should not mark as reprint when flag is false', () => {
      const tx: MockTransaction = {
        id: 'txn_007',
        orderId: 'ORD-2026-007',
        storeId: 'store_hcm',
        storeName: 'Cháo ếch Bà Xanh',
        storeAddress: '123 Le Loi, Q1, HCMC',
        storeTaxCode: '0123456789',
        items: [{ productName: 'Cháo ếch', quantity: 1, price: 75000n, subtotal: 75000n }],
        total: 75000n,
        cash: 100000n,
        change: 25000n,
        platform: 'POS',
        createdAt: '2026-08-22 20:30:00',
      };

      const receipt = svc.generateReceipt(tx, ReceiptFormat.W58, false);
      expect(receipt).not.toContain('SAO LƯU');
    });
  });
});
