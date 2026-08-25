import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// ── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  storeId: string;
}

export interface Product {
  id: string;
  name: string;
  costPrice: bigint;
  salePrice: bigint;
  unit: string;
  quantity?: number; // optional, used in some test scenarios
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: bigint;
}

export interface Cart {
  id: string;
  storeId: string;
  userId: string;
  items: CartItem[];
  total: bigint;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  storeId: string;
  cashierId: string;
  total: bigint;
  paymentMethod: string;
  items: TransactionItem[];
  createdAt: Date;
}

export interface TransactionItem {
  productId: string;
  quantity: number;
  price: bigint;
}

export interface DashboardKPIs {
  todayRevenue: bigint;
  orderCount: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: bigint;
  }>;
}

export interface RevenueReport {
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  totalRevenue: bigint;
  totalCost: bigint;
  netRevenue: bigint;
}

export interface ProfitReport {
  totalRevenue: bigint;
  totalCost: bigint;
  totalPlatformFee: bigint;
  totalProfit: bigint;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
  period: 'day' | 'week' | 'month';
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  storeId: string;
  productId: string;
  quantity: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncEntity {
  id: string;
  entityType: string;
  data: any;
  updatedAt: Date;
}

// ── Mobile Sync Service ─────────────────────────────────────────────────────

/**
 * Mobile Sync Service for POS Omnichannel MVP
 *
 * Implements:
 * - Mobile login with JWT tokens
 * - Mobile POS: simplified cart + checkout
 * - Mobile reports: revenue, profit, top products
 * - Mobile refund: approve/reject refund requests
 * - Sync API: PUT /api/sync/{entityType}/{id} for WatermelonDB conflict resolution
 *
 * Uses BigInt for all monetary values (cents) — no floating-point arithmetic.
 */
@Injectable()
export class MobileSyncService {
  // ── In-memory stores for unit tests (no Prisma dependency) ────────────────

  private users: Map<string, User> = new Map();
  private usersByUsername: Map<string, string> = new Map(); // username → id

  private products: Map<string, Product> = new Map();

  private carts: Map<string, Cart> = new Map();

  private transactions: Map<string, Transaction> = new Map();

  private refundRequests: Map<string, RefundRequest> = new Map();

  private syncState: Map<string, SyncEntity> = new Map(); // "entityType:id" → data

  // ── Mobile Auth ───────────────────────────────────────────────────────────

  /**
   * Register a new mobile user.
   * In production, this would use bcrypt and Prisma.
   */
  async registerMobileUser(
    username: string,
    password: string,
    role: string,
    storeId: string
  ): Promise<User> {
    if (this.usersByUsername.has(username)) {
      throw new BadRequestException('Username already exists');
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      username,
      passwordHash: await bcrypt.hash(password, 12),
      role,
      storeId,
    };

    this.users.set(id, user);
    this.usersByUsername.set(username, id);

    return user;
  }

  /**
   * Mobile login — returns JWT tokens.
   * In production, this would use bcrypt.compare and JWT.sign.
   */
  async mobileLogin(username: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: { id: string; username: string; role: string; storeId: string };
  }> {
    const userId = this.usersByUsername.get(username);
    if (!userId) {
      throw new BadRequestException('Invalid credentials');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Password check with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate tokens (simplified — in production use JWT)
    const accessToken = JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      storeId: user.storeId,
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    });

    const refreshToken = JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      storeId: user.storeId,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        storeId: user.storeId,
      },
    };
  }

  // ── Mobile POS: Cart + Checkout ───────────────────────────────────────────

  /**
   * Create a new cart for a user.
   */
  createCart(storeId: string, userId: string): string {
    const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cart: Cart = {
      id: cartId,
      storeId,
      userId,
      items: [],
      total: 0n,
      createdAt: new Date(),
    };
    this.carts.set(cartId, cart);
    return cartId;
  }

  /**
   * Add a product to cart.
   */
  addProductToCart(cartId: string, product: Product, quantity: number): void {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    const existingItem = cart.items.find((item) => item.productId === product.id);
    if (existingItem) {
      // Subtract old contribution to total
      cart.total -= existingItem.price * BigInt(existingItem.quantity);
      existingItem.quantity += quantity;
      existingItem.price = product.salePrice;
      // Add new contribution to total
      cart.total += product.salePrice * BigInt(quantity);
    } else {
      cart.items.push({
        productId: product.id,
        quantity,
        price: product.salePrice,
      });
      cart.total += product.salePrice * BigInt(quantity);
    }
  }

  /**
   * Get cart by ID.
   */
  getCart(cartId: string): Cart {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }
    return cart;
  }

  /**
   * Checkout a cart — creates transaction and clears cart.
   */
  async checkoutCart(
    cartId: string,
    paymentMethod: string,
    storeId: string
  ): Promise<{ transactionId: string; status: string }> {
    const cart = this.carts.get(cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found');
    }

    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate total
    const total = cart.items.reduce(
      (sum, item) => sum + item.price * BigInt(item.quantity),
      0n
    );

    // Create transaction
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction: Transaction = {
      id: transactionId,
      storeId,
      cashierId: cart.userId,
      total,
      paymentMethod,
      items: cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
      createdAt: new Date(),
    };

    this.transactions.set(transactionId, transaction);

    // Clear cart
    cart.items = [];

    return { transactionId, status: 'COMPLETED' };
  }

  // ── Mobile Reports ────────────────────────────────────────────────────────

  /**
   * Register a product for report calculations.
   */
  registerProduct(product: Product): void {
    this.products.set(product.id, product);
  }

  /**
   * Create a transaction for reporting.
   */
  createTransaction(transaction: {
    storeId: string;
    total: bigint;
    items?: { productId: string; quantity: number; price: bigint }[];
  }): string {
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTransaction: Transaction = {
      id: transactionId,
      storeId: transaction.storeId,
      cashierId: 'system',
      total: transaction.total,
      paymentMethod: 'UNKNOWN',
      items: transaction.items?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })) || [],
      createdAt: new Date(),
    };
    this.transactions.set(transactionId, fullTransaction);
    return transactionId;
  }

  /**
   * Get dashboard KPIs for a store.
   */
  getDashboardKpis(storeId: string): DashboardKPIs {
    const storeTransactions = Array.from(this.transactions.values()).filter(
      (t) => t.storeId === storeId
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = storeTransactions.filter((t) => t.createdAt >= today);

    const todayRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0n);
    const orderCount = todayTransactions.length;

    // Calculate top products
    const productSales = new Map<string, { quantity: number; revenue: bigint }>();
    for (const t of todayTransactions) {
      for (const item of t.items) {
        const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0n };
        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.price * BigInt(item.quantity),
        });
      }
    }

    const topProducts = Array.from(productSales.entries())
      .sort((a, b) => Number(b[1].revenue) - Number(a[1].revenue))
      .slice(0, 5)
      .map(([productId, data]) => ({
        productId,
        productName: this.products.get(productId)?.name || `Product ${productId}`,
        quantity: data.quantity,
        revenue: data.revenue,
      }));

    return {
      todayRevenue,
      orderCount,
      topProducts,
    };
  }

  /**
   * Get revenue report for a date range.
   */
  getRevenueReport(storeId: string, range: DateRange): RevenueReport {
    const storeTransactions = Array.from(this.transactions.values()).filter(
      (t) => t.storeId === storeId
    );

    const filtered = storeTransactions.filter(
      (t) => t.createdAt >= range.startDate && t.createdAt <= range.endDate
    );

    const totalRevenue = filtered.reduce((sum, t) => sum + t.total, 0n);
    const totalCost = filtered.reduce((sum, t) => {
      let cost = 0n;
      for (const item of t.items) {
        const product = this.products.get(item.productId);
        if (product) {
          cost += product.costPrice * BigInt(item.quantity);
        }
      }
      return sum + cost;
    }, 0n);

    // Simplified platform fee (2% of revenue)
    const platformFeeRate = 0.02;
    const totalPlatformFee = (totalRevenue * BigInt(platformFeeRate * 100)) / 100n;

    return {
      period: range.period,
      startDate: range.startDate,
      endDate: range.endDate,
      totalRevenue,
      totalCost,
      netRevenue: totalRevenue - totalCost - totalPlatformFee,
    };
  }

  /**
   * Get profit report for a date range.
   */
  getProfitReport(storeId: string, range: DateRange): ProfitReport {
    const revenueReport = this.getRevenueReport(storeId, range);

    return {
      totalRevenue: revenueReport.totalRevenue,
      totalCost: revenueReport.totalCost,
      totalPlatformFee: (revenueReport.totalRevenue * 2n) / 100n, // 2% simplified
      totalProfit: revenueReport.netRevenue,
    };
  }

  // ── Mobile Refund ─────────────────────────────────────────────────────────

  /**
   * Create a refund request.
   */
  async createRefundRequest(
    dto: {
      transactionId: string;
      storeId: string;
      productId: string;
      quantity: number;
      reason: string;
    }
  ): Promise<RefundRequest> {
    const refundId = `rf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const refund: RefundRequest = {
      id: refundId,
      transactionId: dto.transactionId,
      storeId: dto.storeId,
      productId: dto.productId,
      quantity: dto.quantity,
      reason: dto.reason,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.refundRequests.set(refundId, refund);
    return refund;
  }

  /**
   * Approve a refund request.
   */
  approveRefund(refundId: string, approvedBy: string): RefundRequest {
    const refund = this.refundRequests.get(refundId);
    if (!refund) {
      throw new BadRequestException('Refund request not found');
    }

    refund.status = 'APPROVED';
    refund.approvedBy = approvedBy;
    refund.updatedAt = new Date();

    this.refundRequests.set(refundId, refund);
    return refund;
  }

  /**
   * Reject a refund request.
   */
  rejectRefund(
    refundId: string,
    rejectedBy: string,
    rejectionReason: string
  ): RefundRequest {
    const refund = this.refundRequests.get(refundId);
    if (!refund) {
      throw new BadRequestException('Refund request not found');
    }

    refund.status = 'REJECTED';
    refund.rejectionReason = rejectionReason;
    refund.updatedAt = new Date();

    this.refundRequests.set(refundId, refund);
    return refund;
  }

  // ── Sync API: WatermelonDB conflict resolution ────────────────────────────

  /**
   * Sync an entity with last-write-wins conflict resolution.
   * Used by WatermelonDB mobile app to sync with backend.
   *
   * @param entityType - The entity type (product, category, stock, transaction, etc.)
   * @param data - The entity data including `id` and `updatedAt` timestamp
   */
  async syncEntity(entityType: string, data: any): Promise<any> {
    const id = data.id;
    const key = `${entityType}:${id}`;
    const newUpdatedAt = new Date(data.updatedAt);

    const existing = this.syncState.get(key);

    if (existing) {
      const existingUpdatedAt = new Date(existing.updatedAt);

      // Last-write-wins: only update if new timestamp is later
      if (existingUpdatedAt >= newUpdatedAt) {
        // Keep existing data
        return existing.data;
      }
    }

    // Update or create
    const syncEntry: SyncEntity = {
      id,
      entityType,
      data,
      updatedAt: newUpdatedAt,
    };

    this.syncState.set(key, syncEntry);
    return data;
  }

  /**
   * Get synced entity for debugging/testing.
   */
  getSyncedEntity(entityType: string, id: string): any | undefined {
    const key = `${entityType}:${id}`;
    return this.syncState.get(key)?.data;
  }
}

// Export for unit tests without NestJS injector
export const mobileSyncService = new MobileSyncService();
