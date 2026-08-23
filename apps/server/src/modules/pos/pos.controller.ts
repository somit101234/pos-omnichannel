// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import { Controller, Post, Body, Get, Query, BadRequestException } from '@nestjs/common';
import { PosService } from './pos.service';
import { AddToCartRequest, CheckoutRequest, Transaction } from './types';

export class AddToCartDto {
  productId: string;
  quantity: number;
  warehouseId: string;
}

export class CheckoutDto {
  productId: string;
  quantity: number;
  warehouseId: string;
  paymentMethod: 'CASH' | 'CARD';
}

export class GetCartResponse {
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }>;
  total: string;
}

export class CheckoutResponse {
  transactionId: string;
  total: string;
  paymentMethod: 'CASH' | 'CARD';
  change?: string; // for cash payment
}

@Controller('pos')
export class PosController {
  constructor(private posService: PosService) {}

  @Post('cart/add')
  addToCart(@Body() dto: AddToCartDto) {
    const result = this.posService.addToCart({
      productId: dto.productId,
      quantity: dto.quantity,
      warehouseId: dto.warehouseId,
    });
    return {
      total: result.total.toString(),
    };
  }

  @Post('cart/update')
  updateCart(@Body() dto: { productId: string; quantity: number }) {
    const result = this.posService.updateCart(dto.productId, dto.quantity);
    return {
      total: result.total.toString(),
    };
  }

  @Post('cart/remove')
  removeFromCart(@Body() dto: { productId: string }) {
    const result = this.posService.removeFromCart(dto.productId);
    return {
      total: result.total.toString(),
    };
  }

  @Get('cart')
  getCart() {
    const cart = this.posService.getCart();
    const total = this.posService.getCartTotal();
    return {
      items: cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        subtotal: item.subtotal.toString(),
      })),
      total: total.toString(),
    };
  }

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto): Transaction {
    const result = this.posService.checkout({
      productId: dto.productId,
      quantity: dto.quantity,
      warehouseId: dto.warehouseId,
      paymentMethod: dto.paymentMethod,
    });
    return result;
  }
}
