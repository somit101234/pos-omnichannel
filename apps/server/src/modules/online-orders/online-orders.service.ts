// Online Orders service — thuần, không dùng Nest decorators cho dễ test
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';

export enum OnlineOrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface OnlineOrder {
  id: string;
  customerId: string;
  items: OrderItem[];
  status: OnlineOrderStatus;
  createdAt: Date;
  updatedAt: Date;
  rejectionReason?: string;
}

const ORDERS: Record<string, OnlineOrder> = {};
const ACCEPT_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class OnlineOrdersService {
  createOrder(id: string, customerId: string, items: OrderItem[]): OnlineOrder {
    if (ORDERS[id]) {
      throw new ConflictException(`Order ${id} already exists`);
    }

    const now = new Date();
    const order: OnlineOrder = {
      id,
      customerId,
      items: items.slice(), // deep copy by value
      status: OnlineOrderStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    ORDERS[id] = order;
    return order;
  }

  getOrder(id: string): OnlineOrder {
    const order = ORDERS[id];
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  acceptOrder(id: string): OnlineOrder {
    const order = this.getOrder(id);
    if (order.status === OnlineOrderStatus.REJECTED) {
      throw new ConflictException('Cannot accept rejected order');
    }
    if (order.status === OnlineOrderStatus.PROCESSING) {
      throw new ConflictException('Order is already PROCESSING');
    }

    order.status = OnlineOrderStatus.PROCESSING;
    order.updatedAt = new Date();
    return order;
  }

  rejectOrder(id: string, reason: string): OnlineOrder {
    const order = this.getOrder(id);
    order.status = OnlineOrderStatus.REJECTED;
    order.rejectionReason = reason;
    order.updatedAt = new Date();
    return order;
  }

  prepareOrder(id: string): OnlineOrder {
    const order = this.getOrder(id);
    if (order.status !== OnlineOrderStatus.PROCESSING) {
      throw new ConflictException('Order must be PROCESSING before preparing');
    }

    order.status = OnlineOrderStatus.READY;
    order.updatedAt = new Date();
    return order;
  }

  deliverOrder(id: string): OnlineOrder {
    const order = this.getOrder(id);
    if (order.status !== OnlineOrderStatus.READY) {
      throw new ConflictException('Order must be READY before delivering');
    }

    order.status = OnlineOrderStatus.DELIVERED;
    order.updatedAt = new Date();
    return order;
  }

  isOrderOverdue(id: string, now: Date = new Date()): boolean {
    const order = this.getOrder(id);
    if (order.status !== OnlineOrderStatus.PENDING) {
      return false;
    }

    const age = now.getTime() - order.createdAt.getTime();
    return age > ACCEPT_THRESHOLD_MS;
  }

  getAllOrders(): OnlineOrder[] {
    return Object.values(ORDERS);
  }

  getPendingOrders(): OnlineOrder[] {
    return Object.values(ORDERS).filter(
      (o) => o.status === OnlineOrderStatus.PENDING,
    );
  }

  reset(): void {
    for (const key of Object.keys(ORDERS)) {
      delete ORDERS[key];
    }
  }
}
