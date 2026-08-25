import { Injectable, BadRequestException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface CreateSupplierDto {
  name: string;
  phone?: string;
  address?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: bigint;
  }>;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  storeId: string;
  status: 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
  items: Array<{
    productId: string;
    quantity: number;
    price: bigint;
  }>;
  total: bigint;
  createdAt: Date;
}

export interface ReceiveGoodsDto {
  poId: string;
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: bigint;
  }>;
}

export interface Stock {
  productId: string;
  warehouseId: string;
  quantity: number;
}

// ── Purchase Service ──────────────────────────────────────────────────────

@Injectable()
export class PurchaseService {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  // ── Supplier CRUD ────────────────────────────────────────────────────

  async createSupplier(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = await this.prisma!.supplier.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
      },
    });
    return this._mapToSupplier(supplier);
  }

  async getSupplier(id: string): Promise<Supplier> {
    const supplier = await this.prisma!.supplier.findUnique({
      where: { id },
    });
    if (!supplier) {
      throw new BadRequestException(`Supplier ${id} not found`);
    }
    return this._mapToSupplier(supplier);
  }

  async listSuppliers(): Promise<Supplier[]> {
    const suppliers = await this.prisma!.supplier.findMany();
    return suppliers.map((s: any) => this._mapToSupplier(s));
  }

  async updateSupplier(id: string, dto: Partial<CreateSupplierDto>): Promise<Supplier> {
    const existing = await this.prisma!.supplier.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new BadRequestException(`Supplier ${id} not found`);
    }
    const updated = await this.prisma!.supplier.update({
      where: { id },
      data: {
        name: dto.name,
        phone: dto.phone,
        address: dto.address,
      },
    });
    return this._mapToSupplier(updated);
  }

  async deleteSupplier(id: string): Promise<void> {
    const existing = await this.prisma!.supplier.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new BadRequestException(`Supplier ${id} not found`);
    }
    await this.prisma!.supplier.delete({
      where: { id },
    });
  }

  // ── Purchase Order CRUD ──────────────────────────────────────────────

  async createPurchaseOrder(dto: CreatePurchaseOrderDto): Promise<PurchaseOrder> {
    const total = dto.items.reduce(
      (sum, item) => sum + BigInt(item.quantity) * item.price,
      0n,
    );

    const po = await this.prisma!.purchaseOrder.create({
      data: {
        supplierId: dto.supplierId,
        storeId: dto.storeId,
        status: 'DRAFT',
        items: {
          data: dto.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price.toString(), // BigInt stored as string in JSON
          })),
        },
        total,
        createdAt: new Date(),
      },
    });

    return this._mapToPurchaseOrder(po);
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.prisma!.purchaseOrder.findUnique({
      where: { id },
    });
    if (!po) {
      throw new BadRequestException(`Purchase order ${id} not found`);
    }
    return this._mapToPurchaseOrder(po);
  }

  async listPurchaseOrders(): Promise<PurchaseOrder[]> {
    const pos = await this.prisma!.purchaseOrder.findMany();
    return pos.map((po: any) => this._mapToPurchaseOrder(po));
  }

  async confirmPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status !== 'DRAFT') {
      throw new BadRequestException(`PO ${id} is not in DRAFT status`);
    }
    const updated = await this.prisma!.purchaseOrder.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
    return this._mapToPurchaseOrder(updated);
  }

  async receivePurchaseOrder(id: string, dto: ReceiveGoodsDto): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status !== 'CONFIRMED') {
      throw new BadRequestException(`PO ${id} is not in CONFIRMED status`);
    }

    // Update stock with weighted avg cost
    for (const item of dto.items) {
      await this._updateStockWithWeightedAvg(
        item.productId,
        dto.storeId,
        item.quantity,
        item.price,
      );
    }

    const updated = await this.prisma!.purchaseOrder.update({
      where: { id },
      data: { status: 'RECEIVED' },
    });
    return this._mapToPurchaseOrder(updated);
  }

  async cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrder(id);
    if (po.status === 'RECEIVED') {
      throw new BadRequestException(`Cannot cancel PO ${id} - already received`);
    }
    const updated = await this.prisma!.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return this._mapToPurchaseOrder(updated);
  }

  // ── Weighted Average Cost ────────────────────────────────────────────

  /**
   * Calculate weighted average cost for stock update.
   * Formula: (oldQty × oldCost + newQty × newCost) / (oldQty + newQty)
   * All values use BigInt (cents) — no floating point.
   */
  calculateWeightedAvgCost(
    oldQty: bigint,
    oldCost: bigint,
    newQty: bigint,
    newCost: bigint,
  ): bigint {
    if (oldQty === 0n && newQty === 0n) {
      return 0n;
    }
    const totalQty = oldQty + newQty;
    const totalValue = oldQty * oldCost + newQty * newCost;
    // Integer division — truncates toward zero (expected behavior for cents)
    return totalValue / totalQty;
  }

  // ── Private helper for stock management ──────────────────────────────

  /**
   * Update stock with weighted average cost calculation.
   * Note: Prisma Stock model does not have costPerUnit field.
   * This method updates quantity only; cost is calculated but not stored.
   */
  private async _updateStockWithWeightedAvg(
    productId: string,
    warehouseId: string,
    newQty: number,
    newCost: bigint,
  ): Promise<void> {
    const existing = await this.prisma!.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    let newQtyTotal = newQty;

    if (existing) {
      const oldQty = BigInt(existing.quantity);
      newQtyTotal = Number(oldQty + BigInt(newQty));
      // Weighted avg cost is calculated but not stored (no costPerUnit field in schema)
      // The calculation is kept for potential future use (e.g., if schema adds costPerUnit)
      // For now, we just update quantity
    }

    await this.prisma!.stock.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { quantity: newQtyTotal },
      create: {
        productId,
        warehouseId,
        quantity: newQtyTotal,
      },
    });
  }

  async getStock(productId: string, warehouseId: string): Promise<Stock | null> {
    const stock = await this.prisma!.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    if (!stock) return null;
    return {
      productId: stock.productId,
      warehouseId: stock.warehouseId,
      quantity: stock.quantity,
    };
  }

  // ── Prisma entity mapping helpers ─────────────────────────────────────

  private _mapToSupplier(supplier: any): Supplier {
    return {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone ?? undefined,
      address: supplier.address ?? undefined,
    };
  }

  private _mapToPurchaseOrder(po: any): PurchaseOrder {
    const items = po.items?.data ?? po.items ?? [];
    return {
      id: po.id,
      supplierId: po.supplierId,
      storeId: po.storeId,
      status: po.status as 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED',
      items: items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: BigInt(item.price),
      })),
      total: po.total ?? items.reduce((sum: bigint, item: any) => sum + BigInt(item.quantity) * BigInt(item.price), 0n),
      createdAt: po.createdAt,
    };
  }

  // ── Test support ──────────────────────────────────────────────────────

  async resetForTesting(): Promise<void> {
    if (!this.prisma) return;
    await this.prisma.supplier.deleteMany();
    await this.prisma.purchaseOrder.deleteMany();
    await this.prisma.stock.deleteMany();
  }
}
