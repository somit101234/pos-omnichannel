import { Injectable, BadRequestException } from '@nestjs/common';

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

// ── In-memory store for tests (no Prisma dependency) ──────────────────────

interface SupplierEntry {
  id: string;
  name: string;
  phone?: string;
  address?: string;
}

interface PurchaseOrderEntry {
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

interface StockEntry {
  productId: string;
  warehouseId: string;
  quantity: bigint;
  costPerUnit: bigint; // weighted avg cost (cents)
}

// ── Purchase Service ──────────────────────────────────────────────────────

@Injectable()
export class PurchaseService {
  // In-memory stores (suitable for unit tests)
  private suppliers: Map<string, SupplierEntry> = new Map();
  private purchaseOrders: Map<string, PurchaseOrderEntry> = new Map();
  private stocks: Map<string, StockEntry> = new Map(); // key: productId:warehouseId

  // ── Supplier CRUD ────────────────────────────────────────────────────

  createSupplier(dto: CreateSupplierDto): Supplier {
    const id = `supplier_${dto.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;
    this.suppliers.set(id, {
      id,
      name: dto.name,
      phone: dto.phone,
      address: dto.address,
    });
    return this.getSupplier(id);
  }

  getSupplier(id: string): Supplier {
    const supplier = this.suppliers.get(id);
    if (!supplier) {
      throw new BadRequestException(`Supplier ${id} not found`);
    }
    return {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      address: supplier.address,
    };
  }

  listSuppliers(): Supplier[] {
    return Array.from(this.suppliers.values()).map(s => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
    }));
  }

  updateSupplier(id: string, dto: Partial<CreateSupplierDto>): Supplier {
    const existing = this.suppliers.get(id);
    if (!existing) {
      throw new BadRequestException(`Supplier ${id} not found`);
    }
    if (dto.name) existing.name = dto.name;
    if (dto.phone !== undefined) existing.phone = dto.phone;
    if (dto.address !== undefined) existing.address = dto.address;
    return this.getSupplier(id);
  }

  deleteSupplier(id: string): void {
    if (!this.suppliers.delete(id)) {
      throw new BadRequestException(`Supplier ${id} not found`);
    }
  }

  // ── Purchase Order CRUD ──────────────────────────────────────────────

  createPurchaseOrder(dto: CreatePurchaseOrderDto): PurchaseOrder {
    const id = `po_${Date.now()}`;
    const total = dto.items.reduce((sum, item) => sum + item.price * BigInt(item.quantity), 0n);
    const po: PurchaseOrderEntry = {
      id,
      supplierId: dto.supplierId,
      storeId: dto.storeId,
      status: 'DRAFT',
      items: dto.items,
      total,
      createdAt: new Date(),
    };
    this.purchaseOrders.set(id, po);
    return this.getPurchaseOrder(id);
  }

  getPurchaseOrder(id: string): PurchaseOrder {
    const po = this.purchaseOrders.get(id);
    if (!po) {
      throw new BadRequestException(`Purchase order ${id} not found`);
    }
    return {
      id: po.id,
      supplierId: po.supplierId,
      storeId: po.storeId,
      status: po.status,
      items: po.items,
      total: po.total,
      createdAt: po.createdAt,
    };
  }

  listPurchaseOrders(): PurchaseOrder[] {
    return Array.from(this.purchaseOrders.values()).map(po => ({
      id: po.id,
      supplierId: po.supplierId,
      storeId: po.storeId,
      status: po.status,
      items: po.items,
      total: po.total,
      createdAt: po.createdAt,
    }));
  }

  confirmPurchaseOrder(id: string): PurchaseOrder {
    const po = this.purchaseOrders.get(id);
    if (!po) {
      throw new BadRequestException(`Purchase order ${id} not found`);
    }
    if (po.status !== 'DRAFT') {
      throw new BadRequestException(`PO ${id} is not in DRAFT status`);
    }
    po.status = 'CONFIRMED';
    return this.getPurchaseOrder(id);
  }

  receivePurchaseOrder(id: string, dto: ReceiveGoodsDto): PurchaseOrder {
    const po = this.purchaseOrders.get(id);
    if (!po) {
      throw new BadRequestException(`Purchase order ${id} not found`);
    }
    if (po.status !== 'CONFIRMED') {
      throw new BadRequestException(`PO ${id} is not in CONFIRMED status`);
    }

    // Update stock with weighted avg cost
    for (const item of dto.items) {
      this._updateStockWithWeightedAvg(
        item.productId,
        dto.storeId,
        BigInt(item.quantity),
        item.price,
      );
    }

    po.status = 'RECEIVED';
    return this.getPurchaseOrder(id);
  }

  cancelPurchaseOrder(id: string): PurchaseOrder {
    const po = this.purchaseOrders.get(id);
    if (!po) {
      throw new BadRequestException(`Purchase order ${id} not found`);
    }
    if (po.status === 'RECEIVED') {
      throw new BadRequestException(`Cannot cancel PO ${id} - already received`);
    }
    po.status = 'CANCELLED';
    return this.getPurchaseOrder(id);
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

  private _updateStockWithWeightedAvg(
    productId: string,
    warehouseId: string,
    newQty: bigint,
    newCost: bigint,
  ): void {
    const key = `${productId}:${warehouseId}`;
    const existing = this.stocks.get(key);

    let newQtyTotal = newQty;
    let newCostAvg = newCost;

    if (existing) {
      newQtyTotal = existing.quantity + newQty;
      newCostAvg = this.calculateWeightedAvgCost(
        existing.quantity,
        existing.costPerUnit,
        newQty,
        newCost,
      );
    }

    this.stocks.set(key, {
      productId,
      warehouseId,
      quantity: newQtyTotal,
      costPerUnit: newCostAvg,
    });
  }

  getStock(productId: string, warehouseId: string) {
    const key = `${productId}:${warehouseId}`;
    return this.stocks.get(key);
  }
}
