import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Request,
} from '@nestjs/common';
import {
  MobileSyncService,
  User,
  Product,
  RefundRequest,
} from './mobile-sync.service';

// ── DTOs ───────────────────────────────────────────────────────────────────

export class MobileLoginDto {
  username: string;
  password: string;
}

export class MobileRegisterDto {
  username: string;
  password: string;
  role?: string;
  storeId: string;
}

export class AddProductToCartDto {
  productId: string;
  quantity: number;
}

export class CheckoutCartDto {
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE';
}

export class CreateRefundRequestDto {
  transactionId: string;
  storeId: string;
  productId: string;
  quantity: number;
  reason: string;
}

export class SyncDto {
  id: string;
  updatedAt: string;
  [key: string]: any;
}

// ── Controller ─────────────────────────────────────────────────────────────

@Controller('mobile')
export class MobileSyncController {
  constructor(private readonly mobileSyncService: MobileSyncService) {}

  // ── Mobile Auth ───────────────────────────────────────────────────────────

  @Post('login')
  async login(@Body() dto: MobileLoginDto) {
    return this.mobileSyncService.mobileLogin(dto.username, dto.password);
  }

  @Post('register')
  async register(@Body() dto: MobileRegisterDto): Promise<User> {
    return this.mobileSyncService.registerMobileUser(
      dto.username,
      dto.password,
      dto.role || 'CASHIER',
      dto.storeId
    );
  }

  // ── Mobile POS: Cart ──────────────────────────────────────────────────────

  @Post('carts')
  createCart(@Body() dto: { storeId: string; userId: string }) {
    return { cartId: this.mobileSyncService.createCart(dto.storeId, dto.userId) };
  }

  @Post('carts/:cartId/products')
  addProductToCart(
    @Param('cartId') cartId: string,
    @Body() dto: AddProductToCartDto
  ) {
    const product: Product = {
      id: dto.productId,
      name: 'Mobile Product',
      costPrice: 0n,
      salePrice: 0n, // Would be fetched from DB in production
      unit: 'piece',
    };
    this.mobileSyncService.addProductToCart(cartId, product, dto.quantity);
    return { message: 'Product added to cart' };
  }

  @Get('carts/:cartId')
  getCart(@Param('cartId') cartId: string) {
    return this.mobileSyncService.getCart(cartId);
  }

  // ── Mobile POS: Checkout ──────────────────────────────────────────────────

  @Post('carts/:cartId/checkout')
  async checkoutCart(
    @Param('cartId') cartId: string,
    @Body() dto: CheckoutCartDto,
    @Request() req: any
  ) {
    const storeId = req.body?.storeId || 'default_store';
    return this.mobileSyncService.checkoutCart(cartId, dto.paymentMethod, storeId);
  }

  // ── Mobile Reports ────────────────────────────────────────────────────────

  @Get('dashboard/:storeId')
  getDashboard(@Param('storeId') storeId: string) {
    return this.mobileSyncService.getDashboardKpis(storeId);
  }

  @Get('reports/revenue/:storeId')
  getRevenueReport(
    @Param('storeId') storeId: string,
  ) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return this.mobileSyncService.getRevenueReport(storeId, {
      startDate: yesterday,
      endDate: today,
      period: 'day',
    });
  }

  @Get('reports/profit/:storeId')
  getProfitReport(
    @Param('storeId') storeId: string,
  ) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return this.mobileSyncService.getProfitReport(storeId, {
      startDate: yesterday,
      endDate: today,
      period: 'day',
    });
  }

  // ── Mobile Refund ─────────────────────────────────────────────────────────

  @Post('refunds')
  async createRefund(@Body() dto: CreateRefundRequestDto): Promise<RefundRequest> {
    return this.mobileSyncService.createRefundRequest(dto);
  }

  @Put('refunds/:refundId/approve')
  approveRefund(
    @Param('refundId') refundId: string,
    @Request() req: any
  ) {
    return this.mobileSyncService.approveRefund(refundId, req.body?.userId || 'system');
  }

  @Put('refunds/:refundId/reject')
  rejectRefund(
    @Param('refundId') refundId: string,
    @Body() dto: { userId: string; reason: string }
  ) {
    return this.mobileSyncService.rejectRefund(refundId, dto.userId, dto.reason);
  }

  // ── Sync API: WatermelonDB conflict resolution ────────────────────────────

  @Put('sync/:entityType/:id')
  async syncEntity(
    @Param('entityType') entityType: string,
    @Param('id') _id: string, // unused - id is in dto
    @Body() dto: SyncDto
  ) {
    // dto already contains id and updatedAt, pass directly
    return this.mobileSyncService.syncEntity(entityType, dto);
  }
}
