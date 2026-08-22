import { Injectable, BadRequestException } from '@nestjs/common';
import { Product, Stock, BomItem, CartItem, Transaction, TransactionItem, AddToCartRequest, CheckoutRequest, PosDependencyInjection } from './types';

/**
 * POS (Point of Sale) Service.
 *
 * Handles:
 * - Cart operations (add, update, remove, clear)
 * - Checkout (cash/card payment)
 * - Auto stock deduction after sale
 * - BOM ingredient deduction (recursive)
 *
 * All monetary values use BigInt (cents) — no floating-point arithmetic.
 */
@Injectable()
export class PosService {
  // ── Cart in memory (per request/session) ──────────────────────────────────
  private cart: CartItem[] = [];

  // ── Dependencies (injected via constructor) ───────────────────────────────
  private readonly stockGetter: (productId: string, warehouseId: string) => Stock | undefined;
  private readonly productGetter: (id: string) => Product | undefined;
  private readonly bomGetter: () => BomItem[];

  constructor(di: PosDependencyInjection) {
    this.stockGetter = di.stockGetter;
    this.productGetter = di.productGetter;
    this.bomGetter = di.bomGetter;
  }

  // ── Cart operations ───────────────────────────────────────────────────────

  /**
   * Add product to cart.
   * Throws if product not found or stock = 0.
   */
  addToCart(request: AddToCartRequest): { total: bigint } {
    const product = this.productGetter(request.productId);
    if (!product) {
      throw new BadRequestException(`Product ${request.productId} not found`);
    }

    const stock = this.stockGetter(request.productId, request.warehouseId);
    if (!stock || stock.quantity === 0) {
      throw new BadRequestException(`Out of stock for product ${request.productId}`);
    }

    // Check if already in cart
    const existingItem = this.cart.find((item) => item.productId === request.productId);
    if (existingItem) {
      existingItem.quantity += request.quantity;
    } else {
      this.cart.push({
        productId: request.productId,
        productName: product.name,
        quantity: request.quantity,
        unitPrice: product.salePrice,
        subtotal: product.salePrice * BigInt(request.quantity),
      });
    }

    // Recalculate cart total
    const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0n);

    return { total };
  }

  /**
   * Update quantity of an item in cart.
   * If newQuantity <= 0, remove item from cart.
   */
  updateCart(productId: string, newQuantity: number): { total: bigint } {
    const item = this.cart.find((item) => item.productId === productId);
    if (!item) {
      throw new BadRequestException(`Item ${productId} not in cart`);
    }

    if (newQuantity <= 0) {
      this.cart = this.cart.filter((item) => item.productId !== productId);
    } else {
      item.quantity = newQuantity;
      item.subtotal = item.unitPrice * BigInt(newQuantity);
    }

    const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0n);
    return { total };
  }

  /**
   * Remove item from cart.
   */
  removeFromCart(productId: string): { total: bigint } {
    const originalLength = this.cart.length;
    this.cart = this.cart.filter((item) => item.productId !== productId);

    // If item was not in cart, return 0 total
    if (originalLength === this.cart.length) {
      return { total: 0n };
    }

    const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0n);
    return { total };
  }

  /**
   * Clear all items from cart.
   */
  clearCart(): void {
    this.cart = [];
  }

  /**
   * Get copy of cart items.
   */
  getCart(): CartItem[] {
    return [...this.cart];
  }

  /**
   * Get cart total.
   */
  getCartTotal(): bigint {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0n);
  }

  // ── Checkout ──────────────────────────────────────────────────────────────

  /**
   * Process checkout.
   * Creates transaction, deducts stock, and deducts BOM ingredient stock recursively.
   */
  checkout(request: CheckoutRequest): Transaction {
    const product = this.productGetter(request.productId);
    if (!product) {
      throw new BadRequestException(`Product ${request.productId} not found`);
    }

    const stock = this.stockGetter(request.productId, request.warehouseId);
    if (!stock) {
      throw new BadRequestException(`Stock not found for product ${request.productId}`);
    }

    // Check stock availability
    if (stock.quantity < request.quantity) {
      throw new BadRequestException(
        `Insufficient stock: available=${stock.quantity}, requested=${request.quantity}`,
      );
    }

    // Create transaction
    const transaction: Transaction = {
      id: `txn_${Date.now()}`,
      storeId: request.productId.split('_')[0] === 'prod' ? 'store_001' : request.productId.substring(0, 5), // placeholder
      cashierId: 'user_cashier_001', // placeholder
      type: 'SALE',
      status: 'COMPLETED',
      total: product.salePrice * BigInt(request.quantity),
      paymentMethod: request.paymentMethod,
      createdAt: new Date(),
      items: [
        {
          id: `txn_item_${Date.now()}`,
          transactionId: '', // will be set by caller
          productId: product.id,
          productName: product.name,
          quantity: request.quantity,
          price: product.salePrice,
          subtotal: product.salePrice * BigInt(request.quantity),
        },
      ],
    };

    // Update stock
    stock.quantity -= request.quantity;

    // If product is BOM, deduct ingredient stock recursively
    if (product.isBom) {
      const bomItems = this.bomGetter().filter(
        (item) => item.bomProductId === product.id,
      );
      for (const bomItem of bomItems) {
        const ingredientStock = this.stockGetter(
          bomItem.ingredientProductId,
          request.warehouseId,
        );
        if (ingredientStock) {
          const effectiveQty = bomItem.quantity * bomItem.conversionRate;
          if (ingredientStock.quantity < effectiveQty) {
            throw new BadRequestException(
              `Insufficient ingredient stock for BOM: ingredient=${bomItem.ingredientProductId}, available=${ingredientStock.quantity}, needed=${effectiveQty}`,
            );
          }
          ingredientStock.quantity -= effectiveQty;
        }
      }
    }

    return transaction;
  }
}
