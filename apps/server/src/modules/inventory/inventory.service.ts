import { Injectable, BadRequestException } from '@nestjs/common';

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
  // In-memory store for unit tests (no Prisma dependency)
  private stockMap: Map<string, Stock> = new Map();
  private minStockMap: Map<string, number> = new Map(); // productId → minStock

  // ── Stock management ────────────────────────────────────────────────

  /**
   * Register a stock entry.
   * Used for unit tests — in production, this would come from Prisma.
   */
  registerStock(stock: Stock): void {
    const key = `${stock.productId}:${stock.warehouseId}`;
    this.stockMap.set(key, { ...stock });
  }

  /**
   * Register minimum stock threshold for a product.
   */
  registerMinStock(productId: string, minStock: number): void {
    this.minStockMap.set(productId, minStock);
  }

  /**
   * Get stock by productId and warehouseId.
   */
  getStock(productId: string, warehouseId: string): Stock | undefined {
    const key = `${productId}:${warehouseId}`;
    return this.stockMap.get(key);
  }

  // ── Auto-decrease stock after POS ────────────────────────────────────

  /**
   * Decrease stock quantity after a sale.
   * Throws if insufficient stock.
   */
  autoDecreaseStock(stock: Stock, quantity: number): Stock {
    if (quantity < 0) {
      throw new BadRequestException('Quantity decrease must be non-negative');
    }

    if (stock.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient stock for product ${stock.productId}: available=${stock.quantity}, requested=${quantity}`,
      );
    }

    stock.quantity -= quantity;
    return stock;
  }

  // ── Variance calculation ─────────────────────────────────────────────

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
  checkLowStock(stocks: LowStockProduct[]): LowStockProduct[] {
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
}
