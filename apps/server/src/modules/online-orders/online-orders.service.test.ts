import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OnlineOrdersService, OnlineOrderStatus } from './online-orders.service';

// Mock PrismaService cho test
class MockPrismaService {
  onlineOrder = {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };
}

describe('OnlineOrdersService', () => {
  let service: OnlineOrdersService;
  let mockPrisma: MockPrismaService;

  beforeEach(() => {
    mockPrisma = new MockPrismaService();
    service = new OnlineOrdersService(mockPrisma as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const BASE_TIME = new Date('2026-08-22T10:00:00Z').getTime();

  // ===== AC1: Status flow: PENDING → PROCESSING → READY → DELIVERED =====

  describe('AC1 — Status flow: PENDING → PROCESSING → READY → DELIVERED', () => {
    it('should create order with status PENDING', async () => {
      const now = new Date(BASE_TIME);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD001',
        customerId: 'customer1',
        items: { data: [{ productId: 'PROD1', quantity: 2 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null); // not found

      const order = await service.createOrder('ORD001', 'customer1', [
        { productId: 'PROD1', quantity: 2 },
      ]);
      expect(order.status).toBe(OnlineOrderStatus.PENDING);
      expect(order.id).toBe('ORD001');
      expect(order.customerId).toBe('customer1');
      expect(order.items).toHaveLength(1);
      expect(order.items[0].productId).toBe('PROD1');
      expect(order.items[0].quantity).toBe(2);
    });

    it('should accept order and change status to PROCESSING', async () => {
      const now = new Date(BASE_TIME);
      // First createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null); // not found
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD002',
        customerId: 'customer2',
        items: { data: [{ productId: 'PROD2', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      const order = await service.createOrder('ORD002', 'customer2', [
        { productId: 'PROD2', quantity: 1 },
      ]);
      expect(order.status).toBe(OnlineOrderStatus.PENDING);

      // Then acceptOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD002',
        customerId: 'customer2',
        items: { data: [{ productId: 'PROD2', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD002',
        customerId: 'customer2',
        items: { data: [{ productId: 'PROD2', quantity: 1 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      const accepted = await service.acceptOrder('ORD002');
      expect(accepted.status).toBe(OnlineOrderStatus.PROCESSING);
    });

    it('should set status to READY after processing', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD003',
        customerId: 'customer3',
        items: { data: [{ productId: 'PROD3', quantity: 3 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await service.createOrder('ORD003', 'customer3', [
        { productId: 'PROD3', quantity: 3 },
      ]);

      // acceptOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD003',
        customerId: 'customer3',
        items: { data: [{ productId: 'PROD3', quantity: 3 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD003',
        customerId: 'customer3',
        items: { data: [{ productId: 'PROD3', quantity: 3 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      await service.acceptOrder('ORD003');

      // prepareOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD003',
        customerId: 'customer3',
        items: { data: [{ productId: 'PROD3', quantity: 3 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD003',
        customerId: 'customer3',
        items: { data: [{ productId: 'PROD3', quantity: 3 }] },
        status: 'READY',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 2000),
      });

      const prepared = await service.prepareOrder('ORD003');
      expect(prepared.status).toBe(OnlineOrderStatus.READY);
    });

    it('should deliver order and set status to DELIVERED', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD004',
        customerId: 'customer4',
        items: { data: [{ productId: 'PROD4', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await service.createOrder('ORD004', 'customer4', [
        { productId: 'PROD4', quantity: 1 },
      ]);
      // acceptOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD004',
        customerId: 'customer4',
        items: { data: [{ productId: 'PROD4', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD004',
        customerId: 'customer4',
        items: { data: [{ productId: 'PROD4', quantity: 1 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });
      await service.acceptOrder('ORD004');
      // prepareOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD004',
        customerId: 'customer4',
        items: { data: [{ productId: 'PROD4', quantity: 1 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD004',
        customerId: 'customer4',
        items: { data: [{ productId: 'PROD4', quantity: 1 }] },
        status: 'READY',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 2000),
      });
      await service.prepareOrder('ORD004');
      // deliverOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD004',
        customerId: 'customer4',
        items: { data: [{ productId: 'PROD4', quantity: 1 }] },
        status: 'READY',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 2000),
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD004',
        customerId: 'customer4',
        items: { data: [{ productId: 'PROD4', quantity: 1 }] },
        status: 'DELIVERED',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 3000),
      });

      const delivered = await service.deliverOrder('ORD004');
      expect(delivered.status).toBe(OnlineOrderStatus.DELIVERED);
    });
  });

  // ===== AC2: Reject order → status REJECTED =====

  describe('AC2 — Reject order → status REJECTED', () => {
    it('should reject order and change status to REJECTED', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD005',
        customerId: 'customer5',
        items: { data: [{ productId: 'PROD5', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      const order = await service.createOrder('ORD005', 'customer5', [
        { productId: 'PROD5', quantity: 1 },
      ]);
      expect(order.status).toBe(OnlineOrderStatus.PENDING);

      // rejectOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD005',
        customerId: 'customer5',
        items: { data: [{ productId: 'PROD5', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD005',
        customerId: 'customer5',
        items: { data: [{ productId: 'PROD5', quantity: 1 }] },
        status: 'REJECTED',
        rejectionReason: 'Out of stock',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      const rejected = await service.rejectOrder('ORD005', 'Out of stock');
      expect(rejected.status).toBe(OnlineOrderStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Out of stock');
    });

    it('should not accept order after it has been rejected', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD007',
        customerId: 'customer7',
        items: { data: [{ productId: 'PROD7', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await service.createOrder('ORD007', 'customer7', [
        { productId: 'PROD7', quantity: 1 },
      ]);

      // rejectOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD007',
        customerId: 'customer7',
        items: { data: [{ productId: 'PROD7', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD007',
        customerId: 'customer7',
        items: { data: [{ productId: 'PROD7', quantity: 1 }] },
        status: 'REJECTED',
        rejectionReason: 'Reason 1',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      await service.rejectOrder('ORD007', 'Reason 1');

      // acceptOrder should fail
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD007',
        customerId: 'customer7',
        items: { data: [{ productId: 'PROD7', quantity: 1 }] },
        status: 'REJECTED',
        rejectionReason: 'Reason 1',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      await expect(service.acceptOrder('ORD007')).rejects.toThrow(
        'Cannot accept rejected order',
      );
    });
  });

  // ===== AC3: Alert when order pending > 15min → RED status =====

  describe('AC3 — Alert when order pending > 15min → RED status', () => {
    it('should return isOverdue = true for order pending > 15min', async () => {
      const now = new Date(BASE_TIME);
      const overdueTime = new Date(BASE_TIME - 16 * 60 * 1000);
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_OVERDUE',
        customerId: 'customer_old',
        items: { data: [{ productId: 'PROD_OVERDUE', quantity: 1 }] },
        status: 'PENDING',
        createdAt: overdueTime,
        updatedAt: overdueTime,
      });

      const isOverdue = await service.isOrderOverdue(
        'ORD_OVERDUE',
        new Date(BASE_TIME + 16 * 60 * 1000),
      );
      expect(isOverdue).toBe(true);
    });

    it('should return isOverdue = false for order pending <= 15min', async () => {
      const now = new Date(BASE_TIME);
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_UNDERDUE',
        customerId: 'customer_under',
        items: { data: [{ productId: 'PROD_UNDERDUE', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      const isOverdue = await service.isOrderOverdue('ORD_UNDERDUE', now);
      expect(isOverdue).toBe(false);
    });

    it('should not alert if order moved to PROCESSING before 15min', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD_NOT_OVERDUE',
        customerId: 'customer_n',
        items: { data: [{ productId: 'PROD_N', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await service.createOrder('ORD_NOT_OVERDUE', 'customer_n', [
        { productId: 'PROD_N', quantity: 1 },
      ]);
      // acceptOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_NOT_OVERDUE',
        customerId: 'customer_n',
        items: { data: [{ productId: 'PROD_N', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD_NOT_OVERDUE',
        customerId: 'customer_n',
        items: { data: [{ productId: 'PROD_N', quantity: 1 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      await service.acceptOrder('ORD_NOT_OVERDUE');

      // isOrderOverdue
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_NOT_OVERDUE',
        customerId: 'customer_n',
        items: { data: [{ productId: 'PROD_N', quantity: 1 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      const isOverdue = await service.isOrderOverdue(
        'ORD_NOT_OVERDUE',
        new Date(BASE_TIME + 26 * 60 * 1000),
      );
      expect(isOverdue).toBe(false);
    });
  });

  // ===== Negative / Boundary / Edge cases =====

  describe('Negative and boundary cases', () => {
    it('should throw error when accepting non-existent order', async () => {
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);

      await expect(service.acceptOrder('NON_EXISTENT')).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw error when rejecting non-existent order', async () => {
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);

      await expect(service.rejectOrder('NON_EXISTENT', 'reason')).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw error when preparing non-existent order', async () => {
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);

      await expect(service.prepareOrder('NON_EXISTENT')).rejects.toThrow(
        'Order not found',
      );
    });

    it('should throw error when delivering non-existent order', async () => {
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);

      await expect(service.deliverOrder('NON_EXISTENT')).rejects.toThrow(
        'Order not found',
      );
    });

    it('should not accept order that is already PROCESSING', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD_DUP_ACPT',
        customerId: 'customer_dup',
        items: { data: [{ productId: 'PROD_DUP', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await service.createOrder('ORD_DUP_ACPT', 'customer_dup', [
        { productId: 'PROD_DUP', quantity: 1 },
      ]);
      // acceptOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_DUP_ACPT',
        customerId: 'customer_dup',
        items: { data: [{ productId: 'PROD_DUP', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
      mockPrisma.onlineOrder.update.mockResolvedValue({
        id: 'ORD_DUP_ACPT',
        customerId: 'customer_dup',
        items: { data: [{ productId: 'PROD_DUP', quantity: 1 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      await service.acceptOrder('ORD_DUP_ACPT');
      // second acceptOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_DUP_ACPT',
        customerId: 'customer_dup',
        items: { data: [{ productId: 'PROD_DUP', quantity: 1 }] },
        status: 'PROCESSING',
        createdAt: now,
        updatedAt: new Date(BASE_TIME + 1000),
      });

      await expect(service.acceptOrder('ORD_DUP_ACPT')).rejects.toThrow(
        'Order is already PROCESSING',
      );
    });

    it('should not prepare order that is not PROCESSING', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD_NOT_PREP',
        customerId: 'customer_np',
        items: { data: [{ productId: 'PROD_NP', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await service.createOrder('ORD_NOT_PREP', 'customer_np', [
        { productId: 'PROD_NP', quantity: 1 },
      ]);

      // prepareOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_NOT_PREP',
        customerId: 'customer_np',
        items: { data: [{ productId: 'PROD_NP', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await expect(service.prepareOrder('ORD_NOT_PREP')).rejects.toThrow(
        'Order must be PROCESSING before preparing',
      );
    });

    it('should not deliver order that is not READY', async () => {
      const now = new Date(BASE_TIME);
      // createOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD_NOT_DLV',
        customerId: 'customer_nd',
        items: { data: [{ productId: 'PROD_ND', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await service.createOrder('ORD_NOT_DLV', 'customer_nd', [
        { productId: 'PROD_ND', quantity: 1 },
      ]);

      // deliverOrder
      mockPrisma.onlineOrder.findUnique.mockResolvedValue({
        id: 'ORD_NOT_DLV',
        customerId: 'customer_nd',
        items: { data: [{ productId: 'PROD_ND', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      await expect(service.deliverOrder('ORD_NOT_DLV')).rejects.toThrow(
        'Order must be READY before delivering',
      );
    });

    it('should allow multiple orders with same customer', async () => {
      const now = new Date(BASE_TIME);
      // createOrder 1
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD_MULTI1',
        customerId: 'same_customer',
        items: { data: [{ productId: 'PROD_M1', quantity: 1 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      const order1 = await service.createOrder('ORD_MULTI1', 'same_customer', [
        { productId: 'PROD_M1', quantity: 1 },
      ]);
      // createOrder 2
      mockPrisma.onlineOrder.findUnique.mockResolvedValue(null);
      mockPrisma.onlineOrder.create.mockResolvedValue({
        id: 'ORD_MULTI2',
        customerId: 'same_customer',
        items: { data: [{ productId: 'PROD_M2', quantity: 2 }] },
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });

      const order2 = await service.createOrder('ORD_MULTI2', 'same_customer', [
        { productId: 'PROD_M2', quantity: 2 },
      ]);

      expect(order1.id).not.toBe(order2.id);
      expect(order1.customerId).toBe(order2.customerId);
    });
  });
});
