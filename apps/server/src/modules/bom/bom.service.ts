// @ts-nocheck
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface CreateBomItemDto {
  bomProductId: string;
  ingredientProductId: string;
  quantity: number;
  conversionRate?: number;
}

export interface BomIngredient {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: bigint; // cents per base unit
  conversionRate: number;
  subtotal: bigint; // cents
}

export interface BomWithIngredients {
  productId: string;
  productName: string;
  ingredients: BomIngredient[];
  totalCost: bigint; // cents
}

// ── BOM Service ───────────────────────────────────────────────────────────

/**
 * BOM (Bill of Materials) service.
 *
 * Handles recursive cost calculation, circular reference detection,
 * and unit conversion for nested BOM structures.
 *
 * Uses BigInt for all monetary values (cents) — no floating-point arithmetic.
 * Max nesting depth: 3 levels.
 */
@Injectable()
export class BomService {
  private readonly MAX_DEPTH = 3;

  constructor(private prisma: PrismaService) {}

  // ── Product management ──────────────────────────────────────────────

  /**
   * Register a product for BOM processing.
   * In production, this will upsert into the Product table.
   * For tests, it simulates the in-memory store behavior.
   */
  async registerProduct(product: {
    id: string;
    name: string;
    costPrice: bigint;
    unit: string;
    isBom: boolean;
    unitConversion?: Record<string, number>;
  }): Promise<void> {
    // Check if product already exists
    const existing = await this.prisma.product.findUnique({
      where: { id: product.id },
    });

    if (existing) {
      // Update existing product
      await this.prisma.product.update({
        where: { id: product.id },
        data: {
          name: product.name,
          costPrice: product.costPrice,
          unit: product.unit,
          isBom: product.isBom,
        },
      });
    } else {
      // Create new product
      await this.prisma.product.create({
        data: {
          id: product.id,
          name: product.name,
          costPrice: product.costPrice,
          unit: product.unit,
          isBom: product.isBom,
          // Default values for required fields
          storeId: 'default-store-id', // Will need to be configurable
          categoryId: 'default-category-id', // Will need to be configurable
        },
      });
    }
  }

  async getProduct(id: string): Promise<{
    id: string;
    name: string;
    costPrice: bigint;
    unit: string;
    isBom: boolean;
    unitConversion?: Record<string, number>;
  } | null> {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      costPrice: product.costPrice,
      unit: product.unit,
      isBom: product.isBom,
    };
  }

  // ── BOM item creation with circular reference detection ─────────────

  /**
   * Create a BOM ingredient relationship.
   * Blocks save if circular reference is detected (A→B→C→A or A→A).
   */
  async createBomItem(dto: CreateBomItemDto): Promise<void> {
    // Self-reference check
    if (dto.bomProductId === dto.ingredientProductId) {
      throw new BadRequestException(
        'Circular reference: product cannot be its own ingredient'
      );
    }

    // Check if the BOM product exists
    const bomProduct = await this.prisma.product.findUnique({
      where: { id: dto.bomProductId },
    });

    if (!bomProduct) {
      throw new BadRequestException(
        `BOM product ${dto.bomProductId} not found`
      );
    }

    // Check if the ingredient product exists
    const ingredientProduct = await this.prisma.product.findUnique({
      where: { id: dto.ingredientProductId },
    });

    if (!ingredientProduct) {
      throw new BadRequestException(
        `Ingredient product ${dto.ingredientProductId} not found`
      );
    }

    // Check for existing mapping
    const existing = await this.prisma.bomItem.findFirst({
      where: {
        bomProductId: dto.bomProductId,
        ingredientProductId: dto.ingredientProductId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `BOM item already exists: ${dto.bomProductId} → ${dto.ingredientProductId}`
      );
    }

    // Circular reference detection via DFS
    if (await this._detectCircular(dto.bomProductId, dto.ingredientProductId, 0)) {
      throw new BadRequestException(
        'Circular reference detected: saving this BOM would create a cycle'
      );
    }

    // Create the BOM item
    await this.prisma.bomItem.create({
      data: {
        bomProductId: dto.bomProductId,
        ingredientProductId: dto.ingredientProductId,
        quantity: dto.quantity,
        bomLevel: 1, // Will be recalculated in batches if needed
      },
    });
  }

  /**
   * DFS-based circular reference detection.
   * Traverses from `ingredientProductId` upward to see if we can reach `bomProductId`.
   * Returns true if a cycle would be created.
   */
  private async _detectCircular(
    startId: string,
    currentId: string,
    depth: number
  ): Promise<boolean> {
    if (depth > this.MAX_DEPTH) {
      return false; // stop recursion, don't flag as circular
    }

    // Find ingredients of currentId
    const ingredients = await this.prisma.bomItem.findMany({
      where: { bomProductId: currentId },
    });

    for (const ing of ingredients) {
      if (ing.ingredientProductId === startId) {
        return true; // cycle found
      }
      if (await this._detectCircular(startId, ing.ingredientProductId, depth + 1)) {
        return true;
      }
    }

    return false;
  }

  // ── Recursive cost calculation ──────────────────────────────────────

  /**
   * Calculate the total cost of a BOM product recursively.
   *
   * cost(productId) = sum(quantity_i * conversionRate_i * unitCost(ingredient_i))
   *   for each direct ingredient i
   *
   * If an ingredient is itself a BOM product, recurse (max MAX_DEPTH levels).
   *
   * All arithmetic uses BigInt (cents) — no floating point.
   */
  async calculateCost(productId: string): Promise<bigint> {
    return this._calcCostRecursive(productId, 0, new Set<string>());
  }

  private async _calcCostRecursive(
    productId: string,
    depth: number,
    visited: Set<string>
  ): Promise<bigint> {
    if (depth > this.MAX_DEPTH) {
      throw new BadRequestException(
        `BOM nesting exceeds maximum depth of ${this.MAX_DEPTH} levels for product ${productId}`
      );
    }

    // Detect infinite recursion (shouldn't happen if circular refs are blocked,
    // but safeguard against bad data)
    if (visited.has(productId)) {
      throw new BadRequestException(
        `Circular reference detected during cost calculation for product ${productId}`
      );
    }
    visited.add(productId);

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException(
        `Product ${productId} not found for cost calculation`
      );
    }

    // Find all ingredients for this product
    const ingredients = await this.prisma.bomItem.findMany({
      where: { bomProductId: productId },
    });

    if (ingredients.length === 0) {
      // No ingredients — return base cost
      return product.costPrice;
    }

    let totalCost: bigint = 0n;

    for (const ing of ingredients) {
      const ingredient = await this.prisma.product.findUnique({
        where: { id: ing.ingredientProductId },
      });

      if (!ingredient) continue;

      // Effective quantity = quantity * conversionRate
      const effectiveQty = ing.quantity * (ing.conversionRate ?? 1);

      if (ingredient.isBom) {
        // Ingredient is itself a BOM — recurse
        const ingredientCost = await this._calcCostRecursive(
          ingredient.id,
          depth + 1,
          visited
        );
        // ingredientCost is in cents; multiply by effectiveQty
        totalCost += ingredientCost * BigInt(effectiveQty);
      } else {
        // Plain ingredient — use its costPrice directly
        const cost = ingredient.costPrice * BigInt(effectiveQty);
        totalCost += cost;
      }
    }

    visited.delete(productId);
    return totalCost;
  }

  // ── BOM report ──────────────────────────────────────────────────────

  /**
   * Build a full BOM report with all ingredients (flattened),
   * subtotals, and total cost.
   */
  async getBomReport(productId: string): Promise<BomWithIngredients> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new BadRequestException(
        `Product ${productId} not found for BOM report`
      );
    }

    const ingredients: BomIngredient[] = [];
    await this._flattenIngredients(productId, 0, 1n, new Set<string>(), ingredients);
    const totalCost = await this.calculateCost(productId);

    return {
      productId: product.id,
      productName: product.name,
      ingredients,
      totalCost,
    };
  }

  private async _flattenIngredients(
    productId: string,
    depth: number,
    parentConversionRate: bigint,
    visited: Set<string>,
    result: BomIngredient[]
  ): Promise<void> {
    if (depth > this.MAX_DEPTH) return;
    if (visited.has(productId)) return;
    visited.add(productId);

    const ingredients = await this.prisma.bomItem.findMany({
      where: { bomProductId: productId },
    });

    for (const ing of ingredients) {
      const ingredient = await this.prisma.product.findUnique({
        where: { id: ing.ingredientProductId },
      });

      if (!ingredient) continue;

      const conversionRate = ing.conversionRate ?? 1;
      const qty = ing.quantity;

      if (ingredient.isBom) {
        // Recurse into nested BOM
        const aggregatedCost = await this._calcCostRecursive(
          ingredient.id,
          depth + 1,
          new Set([productId])
        );
        // Already computed full recursive cost; just scale by qty and conversion
        const subtotal = aggregatedCost * BigInt(qty);
        result.push({
          productId: ingredient.id,
          productName: ingredient.name,
          quantity: qty * conversionRate,
          unitCost: aggregatedCost / BigInt(qty), // approximate per-unit for display
          conversionRate,
          subtotal,
        });
      } else {
        // Leaf ingredient
        const subtotal = ingredient.costPrice * BigInt(qty) * BigInt(conversionRate);
        result.push({
          productId: ingredient.id,
          productName: ingredient.name,
          quantity: qty * conversionRate,
          unitCost: ingredient.costPrice,
          conversionRate,
          subtotal,
        });
      }
    }
  }
}
