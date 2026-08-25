// Online Orders service — Prisma integration
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

const ACCEPT_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class OnlineOrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrder(id: string, customerId: string, items: OrderItem[]): Promise<OnlineOrder> {
    const existing = await this.prisma.onlineOrder.findUnique({ where: { id } });
    if (existing) {
      throw new ConflictException(`Order ${id} already exists`);
    }

    const now = new Date();
    const order = await this.prisma.onlineOrder.create({
      data: {
        id,
        customerId,
        items: { data: items },
        status: OnlineOrderStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this._mapToEntity(order);
  }

  async getOrder(id: string): Promise<OnlineOrder> {
    const order = await this.prisma.onlineOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this._mapToEntity(order);
  }

  async acceptOrder(id: string): Promise<OnlineOrder> {
    const order = await this.getOrder(id);
    if (order.status === OnlineOrderStatus.REJECTED) {
      throw new ConflictException('Cannot accept rejected order');
    }
    if (order.status === OnlineOrderStatus.PROCESSING) {
      throw new ConflictException('Order is already PROCESSING');
    }

    const updated = await this.prisma.onlineOrder.update({
      where: { id },
      data: {
        status: OnlineOrderStatus.PROCESSING,
        updatedAt: new Date(),
      },
    });
    return this._mapToEntity(updated);
  }

  async rejectOrder(id: string, reason: string): Promise<OnlineOrder> {
    const order = await this.getOrder(id);

    const updated = await this.prisma.onlineOrder.update({
      where: { id },
      data: {
        status: OnlineOrderStatus.REJECTED,
        rejectionReason: reason,
        updatedAt: new Date(),
      },
    });
    return this._mapToEntity(updated);
  }

  async prepareOrder(id: string): Promise<OnlineOrder> {
    const order = await this.getOrder(id);
    if (order.status !== OnlineOrderStatus.PROCESSING) {
      throw new ConflictException('Order must be PROCESSING before preparing');
    }

    const updated = await this.prisma.onlineOrder.update({
      where: { id },
      data: {
        status: OnlineOrderStatus.READY,
        updatedAt: new Date(),
      },
    });
    return this._mapToEntity(updated);
  }

  async deliverOrder(id: string): Promise<OnlineOrder> {
    const order = await this.getOrder(id);
    if (order.status !== OnlineOrderStatus.READY) {
      throw new ConflictException('Order must be READY before delivering');
    }

    const updated = await this.prisma.onlineOrder.update({
      where: { id },
      data: {
        status: OnlineOrderStatus.DELIVERED,
        updatedAt: new Date(),
      },
    });
    return this._mapToEntity(updated);
  }

  async isOrderOverdue(id: string, now: Date = new Date()): Promise<boolean> {
    const order = await this.prisma.onlineOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== OnlineOrderStatus.PENDING) {
      return false;
    }

    const age = now.getTime() - order.createdAt.getTime();
    return age > ACCEPT_THRESHOLD_MS;
  }

  async getAllOrders(): Promise<OnlineOrder[]> {
    const orders = await this.prisma.onlineOrder.findMany();
    return orders.map((o: any) => this._mapToEntity(o));
  }

  async getPendingOrders(): Promise<OnlineOrder[]> {
    const orders = await this.prisma.onlineOrder.findMany({
      where: { status: OnlineOrderStatus.PENDING },
    });
    return orders.map((o: any) => this._mapToEntity(o));
  }

  async reset(): Promise<void> {
    await this.prisma.onlineOrder.deleteMany();
  }

  // Helper to map Prisma model to domain entity
  private _mapToEntity(order: any): OnlineOrder {
    return {
      id: order.id,
      customerId: order.customerId,
      items: order.items?.data || [],
      status: order.status as OnlineOrderStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      rejectionReason: order.rejectionReason ?? undefined,
    };
  }
}
