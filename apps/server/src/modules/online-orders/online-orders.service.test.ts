import { describe, it, expect, beforeEach } from 'vitest';
import { OnlineOrdersService, OnlineOrderStatus } from './online-orders.service';

describe('OnlineOrdersService', () => {
  let service: OnlineOrdersService;

  beforeEach(() => {
    service = new OnlineOrdersService();
  });

  const BASE_TIME = new Date('2026-08-22T10:00:00Z').getTime();

  // ===== AC1: Status flow: PENDING → PROCESSING → READY → DELIVERED =====

  describe('AC1 — Status flow: PENDING → PROCESSING → READY → DELIVERED', () => {
    it('should create order with status PENDING', () => {
      const order = service.createOrder('ORD001', 'customer1', [
        { productId: 'PROD1', quantity: 2 },
      ]);
      expect(order.status).toBe(OnlineOrderStatus.PENDING);
      expect(order.id).toBe('ORD001');
      expect(order.customerId).toBe('customer1');
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe('PROD1');
      expect(order.items[0].quantity).toBe(2);
    });

    it('should accept order and change status to PROCESSING', () => {
      const order = service.createOrder('ORD002', 'customer2', [
        { productId: 'PROD2', quantity: 1 },
      ]);
      expect(order.status).toBe(OnlineOrderStatus.PENDING);

      service.acceptOrder('ORD002');
      expect(order.status).toBe(OnlineOrderStatus.PROCESSING);
    });

    it('should set status to READY after processing', () => {
      const order = service.createOrder('ORD003', 'customer3', [
        { productId: 'PROD3', quantity: 3 },
      ]);

      service.acceptOrder('ORD003');
      expect(order.status).toBe(OnlineOrderStatus.PROCESSING);

      service.prepareOrder('ORD003');
      expect(order.status).toBe(OnlineOrderStatus.READY);
    });

    it('should deliver order and set status to DELIVERED', () => {
      const order = service.createOrder('ORD004', 'customer4', [
        { productId: 'PROD4', quantity: 1 },
      ]);

      service.acceptOrder('ORD004');
      service.prepareOrder('ORD004');
      expect(order.status).toBe(OnlineOrderStatus.READY);

      service.deliverOrder('ORD004');
      expect(order.status).toBe(OnlineOrderStatus.DELIVERED);
    });
  });

  // ===== AC2: Reject order → status REJECTED =====

  describe('AC2 — Reject order → status REJECTED', () => {
    it('should reject order and change status to REJECTED', () => {
      const order = service.createOrder('ORD005', 'customer5', [
        { productId: 'PROD5', quantity: 1 },
      ]);
      expect(order.status).toBe(OnlineOrderStatus.PENDING);

      service.rejectOrder('ORD005', 'Out of stock');
      expect(order.status).toBe(OnlineOrderStatus.REJECTED);
    });

    it('should reject pending order with reason', () => {
      const order = service.createOrder('ORD006', 'customer6', [
        { productId: 'PROD6', quantity: 1 },
      ]);

      service.rejectOrder('ORD006', 'Customer cancelled');
      expect(order.status).toBe(OnlineOrderStatus.REJECTED);
      expect(order.rejectionReason).toBe('Customer cancelled');
    });

    it('should not accept order after it has been rejected', () => {
      const order = service.createOrder('ORD007', 'customer7', [
        { productId: 'PROD7', quantity: 1 },
      ]);

      service.rejectOrder('ORD007', 'Reason 1');

      expect(() => service.acceptOrder('ORD007')).toThrow('Cannot accept rejected order');
      expect(order.status).toBe(OnlineOrderStatus.REJECTED);
    });
  });

  // ===== AC3: Alert when order pending > 15min → RED status =====

  describe('AC3 — Alert when order pending > 15min → RED status', () => {
    it('should return isOverdue = true for order pending > 15min', () => {
      const oldOrder = service.createOrder('ORD_OVERDUE', 'customer_old', [
        { productId: 'PROD_OVERDUE', quantity: 1 },
      ]);

      // Set order createdAt to 16 minutes ago
      oldOrder.createdAt = new Date(BASE_TIME - 16 * 60 * 1000);

      expect(oldOrder.status).toBe(OnlineOrderStatus.PENDING);
      expect(service.isOrderOverdue('ORD_OVERDUE', new Date(BASE_TIME + 16 * 60 * 1000))).toBe(true);
    });

    it('should return isOverdue = false for order pending <= 15min', () => {
      const order = service.createOrder('ORD_UNDERDUE', 'customer_under', [
        { productId: 'PROD_UNDERDUE', quantity: 1 },
      ]);

      // Order just created, less than 15min
      expect(service.isOrderOverdue('ORD_UNDERDUE', new Date(BASE_TIME))).toBe(false);
    });

    it('should not alert if order moved to PROCESSING before 15min', () => {
      const order = service.createOrder('ORD_NOT_OVERDUE', 'customer_n', [
        { productId: 'PROD_N', quantity: 1 },
      ]);

      // Move to PROCESSING at 10min
      service.acceptOrder('ORD_NOT_OVERDUE');
      expect(order.status).toBe(OnlineOrderStatus.PROCESSING);

      // Check at 26min total (16min since creation) — but already PROCESSING
      expect(service.isOrderOverdue('ORD_NOT_OVERDUE', new Date(BASE_TIME + 26 * 60 * 1000))).toBe(false);
    });
  });

  // ===== Negative / Boundary / Edge cases =====

  describe('Negative and boundary cases', () => {
    it('should throw error when accepting non-existent order', () => {
      expect(() => service.acceptOrder('NON_EXISTENT')).toThrow('Order not found');
    });

    it('should throw error when rejecting non-existent order', () => {
      expect(() => service.rejectOrder('NON_EXISTENT', 'reason')).toThrow('Order not found');
    });

    it('should throw error when preparing non-existent order', () => {
      expect(() => service.prepareOrder('NON_EXISTENT')).toThrow('Order not found');
    });

    it('should throw error when delivering non-existent order', () => {
      expect(() => service.deliverOrder('NON_EXISTENT')).toThrow('Order not found');
    });

    it('should not accept order that is already PROCESSING', () => {
      const order = service.createOrder('ORD_DUP_ACPT', 'customer_dup', [
        { productId: 'PROD_DUP', quantity: 1 },
      ]);
      service.acceptOrder('ORD_DUP_ACPT');

      expect(() => service.acceptOrder('ORD_DUP_ACPT')).toThrow(
        'Order is already PROCESSING',
      );
      expect(order.status).toBe(OnlineOrderStatus.PROCESSING);
    });

    it('should not prepare order that is not PROCESSING', () => {
      const order = service.createOrder('ORD_NOT_PREP', 'customer_np', [
        { productId: 'PROD_NP', quantity: 1 },
      ]);
      // Order still PENDING

      expect(() => service.prepareOrder('ORD_NOT_PREP')).toThrow(
        'Order must be PROCESSING before preparing',
      );
      expect(order.status).toBe(OnlineOrderStatus.PENDING);
    });

    it('should not deliver order that is not READY', () => {
      const order = service.createOrder('ORD_NOT_DLV', 'customer_nd', [
        { productId: 'PROD_ND', quantity: 1 },
      ]);
      // Order still PENDING

      expect(() => service.deliverOrder('ORD_NOT_DLV')).toThrow(
        'Order must be READY before delivering',
      );
      expect(order.status).toBe(OnlineOrderStatus.PENDING);
    });

    it('should allow multiple orders with same customer', () => {
      const order1 = service.createOrder('ORD_MULTI1', 'same_customer', [
        { productId: 'PROD_M1', quantity: 1 },
      ]);
      const order2 = service.createOrder('ORD_MULTI2', 'same_customer', [
        { productId: 'PROD_M2', quantity: 2 },
      ]);

      expect(order1.id).not.toBe(order2.id);
      expect(order1.customerId).toBe(order2.customerId);
    });
  });
});
