import { Injectable, BadRequestException, Inject, Optional } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── Types ───────────────────────────────────────────────────────────────────

export interface Stock {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface LowStockProduct {
  productId: string;
  quantity: number;
  minStock: number;
}

export interface VarianceResult {
  variance: number; // theoretical - actual
  lossCost: bigint; // |variance| × unitCost (only when variance > 0)
}

// ── Inventory Service ──────────────────────────────────────────────────────

/**
 * Inventory service for stock management.
 *
 * - Auto-decrease stock after POS transaction
 * - Variance calculation (theoretical vs actual stock)
 * - Low-stock alert
 *
 * All monetary calculations use BigInt (cents) — no floating-point arithmetic.
 */
@Injectable()
export class InventoryService {
  private db: any;

  constructor(@Optional() db?: any) {
    this.db = db;
  }

  // ── Stock management ────────────────────────────────────────────────

  /**
   * Register a stock entry.
   * Creates or updates stock for a productId/warehouseId pair.
   */
  async registerStock(stock: Stock): Promise<void> {
    await this.db.stock.upsert({
      where: {
        productId_warehouseId: {
          productId: stock.productId,
          warehouseId: stock.warehouseId,
        },
      },
      update: { quantity: stock.quantity },
      create: {
        productId: stock.productId,
        warehouseId: stock.warehouseId,
        quantity: stock.quantity,
      },
    });
  }

  /**
   * Register minimum stock threshold for a product.
   * Stores minStock on the product record.
   */
  async registerMinStock(productId: string, minStock: number): Promise<void> {
    await this.db.product.update({
      where: { id: productId },
      data: { minStock },
    });
  }

  /**
   * Get stock by productId and warehouseId.
   */
  async getStock(productId: string, warehouseId: string): Promise<Stock | null> {
    const stock = await this.db.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });
    if (!stock) return null;
    return {
      productId: stock.productId,
      warehouseId: stock.warehouseId,
      quantity: stock.quantity,
    };
  }

  // ── Auto-decrease stock after POS ────────────────────────────────────

  /**
   * Decrease stock quantity after a sale.
   * Throws if insufficient stock.
   */
  async autoDecreaseStock(
    productId: string,
    warehouseId: string,
    quantity: number,
  ): Promise<Stock> {
    if (quantity < 0) {
      throw new BadRequestException('Quantity decrease must be non-negative');
    }

    const stock = await this.db.stock.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } },
    });

    if (!stock) {
      throw new BadRequestException(
        `Stock not found for product ${productId} in warehouse ${warehouseId}`,
      );
    }

    if (stock.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${productId} in warehouse ${warehouseId}: available=${stock.quantity}, requested=${quantity}`,
      );
    }

    const updatedStock = await this.db.stock.update({
      where: { productId_warehouseId: { productId, warehouseId } },
      data: { quantity: stock.quantity - quantity },
    });

    return {
      productId: updatedStock.productId,
      warehouseId: updatedStock.warehouseId,
      quantity: updatedStock.quantity,
    };
  }

  // ── Variance calculation ─────────────────────────────────────────────
  // NOTE: Pure function — no database interaction needed

  /**
   * Calculate stock variance and loss cost.
   *
   * variance = theoreticalQty - actualQty
   * lossCost = |variance| × unitCost (only when variance > 0, i.e., deficit)
   *
   * FR-030: "Tính hao hụt cost = |variance| × unit_cost cho sản phẩm thiếu"
   * "thiếu" = variance > 0 (theoretical > actual)
   *
   * @param theoreticalQty - Expected stock (from POS records)
   * @param actualQty - Actual stock (from inventory count)
   * @param unitCost - Cost per unit (cents)
   * @returns VarianceResult with variance and lossCost
   */
  calculateVariance(
    theoreticalQty: number,
    actualQty: number,
    unitCost: bigint,
  ): VarianceResult {
    const variance = theoreticalQty - actualQty;
    const lossCost =
      variance > 0 ? BigInt(variance) * unitCost : 0n;

    return { variance, lossCost };
  }

  // ── Low-stock alert ──────────────────────────────────────────────────

  /**
   * Check stock levels against minimum thresholds.
   * Returns list of products that are at or below minimum stock.
   */
  async checkLowStock(stocks: LowStockProduct[]): Promise<LowStockProduct[]> {
    // In production, this would query products where stock <= minStock
    // For now, filter from passed list
    return stocks.filter((s) => s.quantity <= s.minStock);
  }

  // ── Batch operations ─────────────────────────────────────────────────

  /**
   * Process inventory variance for multiple products.
   */
  processInventoryVariance(
    products: Array<{
      productId: string;
      theoreticalQty: number;
      actualQty: number;
      unitCost: bigint;
    }>,
  ): Array<VarianceResult & { productId: string }> {
    return products.map(({ productId, theoreticalQty, actualQty, unitCost }) => {
      const { variance, lossCost } = this.calculateVariance(
        theoreticalQty,
        actualQty,
        unitCost,
      );
      return { productId, variance, lossCost };
    });
  }

  // ── Unit test support ────────────────────────────────────────────────

  /**
   * Reset test state (clear all stock entries).
   * Used for test cleanup between test suites.
   */
  async resetForTesting(): Promise<void> {
    // In production, you might want to delete all stock entries
    // For now, this is a no-op since we're using real DB
  }
}
