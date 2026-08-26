import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OnlineOrdersController } from './online-orders.controller';
import { OnlineOrdersService } from './online-orders.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('OnlineOrdersController', () => {
  let controller: OnlineOrdersController;
  let service: OnlineOrdersService;
  let orderIdCounter = 0;

  const getUniqueId = () => `ORD_${Date.now()}_${++orderIdCounter}`;

  beforeEach(() => {
    service = new OnlineOrdersService();
    controller = new OnlineOrdersController(service);
  });

  afterEach(() => {
    service.reset();
  });

  describe('GET /online-orders', () => {
    it('should return all orders if no status filter', async () => {
      const orderId = getUniqueId();
      await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      const result = await controller.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter orders by status', async () => {
      const orderId1 = getUniqueId();
      const order1 = await service.createOrder(orderId1, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      await service.acceptOrder(orderId1);

      const orderId2 = getUniqueId();
      const order2 = await service.createOrder(orderId2, 'customer2', [{ productId: 'PROD2', quantity: 1 }]);

      const pendingOrders = await controller.findAll('PENDING');
      expect(pendingOrders).toHaveLength(1);
      expect(pendingOrders[0].id).toBe(orderId2);

      const processingOrders = await controller.findAll('PROCESSING');
      expect(processingOrders).toHaveLength(1);
      expect(processingOrders[0].id).toBe(orderId1);
    });
  });

  describe('POST /online-orders/:id/accept', () => {
    it('should accept order', async () => {
      const orderId = getUniqueId();
      const order = await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      const result = await controller.accept(orderId, {});
      expect(result.status).toBe('PROCESSING');
    });

    it('should throw NotFoundException for non-existent order', () => {
      expect(() => controller.accept('NON_EXISTENT', {})).toThrow(NotFoundException);
    });
  });

  describe('POST /online-orders/:id/reject', () => {
    it('should reject order with reason', async () => {
      const orderId = getUniqueId();
      const order = await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      const result = await controller.reject(orderId, { reason: 'Out of stock' });
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Out of stock');
    });

    it('should throw BadRequestException if reason is empty', () => {
      const orderId = getUniqueId();
      service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      expect(() => controller.reject(orderId, { reason: '' })).toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent order', () => {
      expect(() => controller.reject('NON_EXISTENT', { reason: 'reason' })).toThrow(NotFoundException);
    });
  });

  describe('POST /online-orders/:id/prepare', () => {
    it('should prepare order (PROCESSING -> READY)', async () => {
      const orderId = getUniqueId();
      await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      await service.acceptOrder(orderId);
      const result = await controller.prepare(orderId);
      expect(result.status).toBe('READY');
    });

    it('should throw ConflictException if order not PROCESSING', async () => {
      const orderId = getUniqueId();
      const order = await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      expect(() => controller.prepare(orderId)).toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent order', () => {
      expect(() => controller.prepare('NON_EXISTENT')).toThrow(NotFoundException);
    });
  });

  describe('POST /online-orders/:id/deliver', () => {
    it('should deliver order (READY -> DELIVERED)', async () => {
      const orderId = getUniqueId();
      await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      await service.acceptOrder(orderId);
      await service.prepareOrder(orderId);
      const result = await controller.deliver(orderId);
      expect(result.status).toBe('DELIVERED');
    });

    it('should throw ConflictException if order not READY', async () => {
      const orderId = getUniqueId();
      const order = await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      expect(() => controller.deliver(orderId)).toThrow(ConflictException);
    });

    it('should throw NotFoundException for non-existent order', () => {
      expect(() => controller.deliver('NON_EXISTENT')).toThrow(NotFoundException);
    });
  });

  describe('GET /online-orders/:id/overdue', () => {
    it('should return isOverdue = true for pending order > 15min', async () => {
      const orderId = getUniqueId();
      const order = await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      // Manually set createdAt to 20 minutes ago
      (order as any).createdAt = new Date(Date.now() - 20 * 60 * 1000);

      const result = await controller.isOverdue(orderId);
      expect(result.isOverdue).toBe(true);
    });

    it('should return isOverdue = false for pending order <= 15min', async () => {
      const orderId = getUniqueId();
      const order = await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      const result = await controller.isOverdue(orderId);
      expect(result.isOverdue).toBe(false);
    });

    it('should return isOverdue = false if order is not PENDING', async () => {
      const orderId = getUniqueId();
      const order = await service.createOrder(orderId, 'customer1', [{ productId: 'PROD1', quantity: 1 }]);
      await service.acceptOrder(orderId); // Now PROCESSING
      const result = await controller.isOverdue(orderId);
      expect(result.isOverdue).toBe(false);
    });

    it('should throw NotFoundException for non-existent order', () => {
      expect(() => controller.isOverdue('NON_EXISTENT')).toThrow(NotFoundException);
    });
  });
});
