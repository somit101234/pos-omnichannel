import { describe, it, expect, beforeEach } from 'vitest';
import { MobileSyncService, Product, TransactionItem } from './mobile-sync.service';

// Mock types
interface User {
  id: string;
  username: string;
  role: string;
  storeId: string;
}

describe('MobileSyncService', () => {
  let service: MobileSyncService;

  beforeEach(() => {
    service = new MobileSyncService();
  });

  // ===== AC1: Mobile login returns JWT token =====
  describe('AC1 — Mobile login returns JWT token', () => {
    it('should return accessToken, refreshToken, and user on valid login', async () => {
      await service.registerMobileUser('mobileuser1', 'pass123', 'CASHIER', 'store_1');
      const result = await service.mobileLogin('mobileuser1', 'pass123');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).toEqual({
        id: expect.any(String),
        username: 'mobileuser1',
        role: 'CASHIER',
        storeId: 'store_1',
      });
    });

    it('should throw "Invalid credentials" for non-existent user', async () => {
      await expect(service.mobileLogin('notexist', 'password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should throw "Invalid credentials" for wrong password', async () => {
      await service.registerMobileUser('wrongpass1', 'correct', 'OWNER', 'store_1');
      await expect(service.mobileLogin('wrongpass1', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  // ===== AC2: Mobile POS — simplified cart + checkout =====
  describe('AC2 — Mobile POS: simplified cart + checkout', () => {
    it('should create cart and add items', async () => {
      const cartId = service.createCart('store_1', 'user_1');
      expect(cartId).toBeDefined();

      const product: Product = {
        id: 'prod_1',
        name: 'Product 1',
        costPrice: 40000n,
        salePrice: 50000n,
        unit: 'piece',
      };
      service.addProductToCart(cartId, product, 2);

      const cart = service.getCart(cartId);
      expect(cart.items).toHaveLength(1);
      expect(cart.items[0].quantity).toBe(2);
    });

    it('should calculate cart total correctly', async () => {
      const cartId = service.createCart('store_1', 'user_1');

      const products: Product[] = [
        { id: 'prod_1', name: 'Product 1', costPrice: 25000n, salePrice: 30000n, unit: 'piece' },
        { id: 'prod_2', name: 'Product 2', costPrice: 15000n, salePrice: 20000n, unit: 'piece' },
      ];

      products.forEach((p) => service.addProductToCart(cartId, p, 1));

      const cart = service.getCart(cartId);
      expect(cart.total).toBe(50000n); // 30000 + 20000
    });

    it('should checkout and create transaction', async () => {
      const cartId = service.createCart('store_1', 'user_1');
      service.addProductToCart(cartId, {
        id: 'prod_1',
        name: 'Product 1',
        costPrice: 80000n,
        salePrice: 100000n,
        unit: 'piece',
      }, 1);

      const result = await service.checkoutCart(cartId, 'CASH', 'store_1');

      expect(result.transactionId).toBeDefined();
      expect(result.status).toBe('COMPLETED');
    });
  });

  // ===== AC3: Mobile reports — revenue, profit, top products =====
  describe('AC3 — Mobile reports: revenue, profit, top products', () => {
    it('should return dashboard KPIs', async () => {
      // Register a transaction first
      service.createTransaction({
        storeId: 'store_1',
        total: 150000n,
        items: [{ productId: 'prod_1', quantity: 1, price: 150000n } as TransactionItem],
      });

      const kpis = service.getDashboardKpis('store_1');

      expect(kpis).toHaveProperty('todayRevenue');
      expect(kpis).toHaveProperty('orderCount');
      expect(kpis).toHaveProperty('topProducts');
    });

    it('should return revenue report', async () => {
      service.createTransaction({
        storeId: 'store_1',
        total: 200000n,
        items: [{ productId: 'prod_1', quantity: 2, price: 100000n } as TransactionItem],
      });

      const report = service.getRevenueReport('store_1', {
        startDate: new Date(),
        endDate: new Date(),
        period: 'day',
      });

      expect(report).toHaveProperty('totalRevenue');
      expect(report.totalRevenue).toBe(200000n);
    });

    it('should return profit report', async () => {
      // Need to register products with cost price first
      service.registerProduct({
        id: 'prod_1',
        name: 'Product 1',
        costPrice: 50000n,
        salePrice: 100000n,
        unit: 'piece',
      });

      service.createTransaction({
        storeId: 'store_1',
        total: 100000n,
        items: [{ productId: 'prod_1', quantity: 1, price: 100000n } as TransactionItem],
      });

      const report = service.getProfitReport('store_1', {
        startDate: new Date(),
        endDate: new Date(),
        period: 'day',
      });

      expect(report).toHaveProperty('totalProfit');
    });
  });

  // ===== AC4: Mobile refund — approve/reject refund request =====
  describe('AC4 — Mobile refund: approve/reject refund request', () => {
    it('should create refund request', async () => {
      const refund = await service.createRefundRequest({
        transactionId: 'txn_1',
        storeId: 'store_1',
        productId: 'prod_1',
        quantity: 1,
        reason: 'Defective product',
      });

      expect(refund).toHaveProperty('id');
      expect(refund.status).toBe('PENDING');
    });

    it('should approve refund request', async () => {
      const refund = await service.createRefundRequest({
        transactionId: 'txn_1',
        storeId: 'store_1',
        productId: 'prod_1',
        quantity: 1,
        reason: 'Wrong item',
      });

      const approved = service.approveRefund(refund.id, 'user_1');

      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('user_1');
    });

    it('should reject refund request', async () => {
      const refund = await service.createRefundRequest({
        transactionId: 'txn_1',
        storeId: 'store_1',
        productId: 'prod_1',
        quantity: 1,
        reason: 'Changed mind',
      });

      const rejected = service.rejectRefund(refund.id, 'user_1', 'Not eligible');

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toBe('Not eligible');
    });
  });

  // ===== AC5: Sync API — PUT /api/sync/{entityType}/{id} for WatermelonDB conflict resolution =====
  describe('AC5 — Sync API: WatermelonDB conflict resolution', () => {
    it('should handle PUT /sync/product/{id} with last-write-wins', async () => {
      const productData = {
        id: 'prod_sync_1',
        name: 'Sync Product',
        salePrice: 75000n,
        updatedAt: new Date('2026-01-01T12:00:00Z'),
      };

      const result = await service.syncEntity('product', productData);

      expect(result.id).toBe(productData.id);
      expect(result.name).toBe(productData.name);
    });

    it('should use last-write-wins for conflicting updates', async () => {
      // First update
      await service.syncEntity('product', {
        id: 'prod_conflict_1',
        name: 'Original Name',
        salePrice: 50000n,
        updatedAt: new Date('2026-01-01T10:00:00Z'),
      });

      // Later update with newer timestamp (last-write-wins)
      const result = await service.syncEntity('product', {
        id: 'prod_conflict_1',
        name: 'Updated Name',
        salePrice: 60000n,
        updatedAt: new Date('2026-01-01T14:00:00Z'),
      });

      expect(result.name).toBe('Updated Name');
      expect(result.salePrice).toBe(60000n);
    });

    it('should ignore outdated updates (older timestamp)', async () => {
      // First update
      await service.syncEntity('product', {
        id: 'prod_outdated_1',
        name: 'Current Name',
        salePrice: 80000n,
        updatedAt: new Date('2026-01-01T15:00:00Z'),
      });

      // Outdated update (older timestamp)
      const result = await service.syncEntity('product', {
        id: 'prod_outdated_1',
        name: 'Old Name',
        salePrice: 70000n,
        updatedAt: new Date('2026-01-01T10:00:00Z'),
      });

      // Should keep the newer value
      expect(result.name).toBe('Current Name');
    });

    it('should handle sync for all entity types', async () => {
      const entities = [
        { type: 'product', data: { id: 'e1', name: 'Prod' } },
        { type: 'category', data: { id: 'e2', name: 'Cat' } },
        { type: 'stock', data: { id: 'e3', warehouseId: 'wh_1', quantity: 100 } },
        { type: 'transaction', data: { id: 'e4', total: 50000n } },
      ];

      for (const { type, data } of entities) {
        const result = await service.syncEntity(type, data);
        expect(result.id).toBe(data.id);
      }
    });
  });

  // ===== Edge cases / Negative =====
  describe('Edge cases and negative tests', () => {
    it('should prevent negative quantity in cart', () => {
      const cartId = service.createCart('store_1', 'user_1');
      expect(() => {
        service.addProductToCart(cartId, { id: 'p1', name: 'P1', costPrice: 5000n, salePrice: 10000n, unit: 'piece' }, -1);
      }).toThrow('Quantity must be positive');
    });

    it('should throw error when checkout cart with no items', async () => {
      const cartId = service.createCart('store_1', 'user_1');
      await expect(service.checkoutCart(cartId, 'CASH', 'store_1')).rejects.toThrow(
        'Cart is empty'
      );
    });

    it('should not approve refund for non-existent refund request', () => {
      expect(() => {
        service.approveRefund('non_existent_refund', 'user_1');
      }).toThrow('Refund request not found');
    });
  });
});
