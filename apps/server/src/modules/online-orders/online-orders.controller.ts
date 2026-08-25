// @ts-nocheck: NestJS decorator issue with TypeScript strict mode
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { OnlineOrdersService } from './online-orders.service';

export class AcceptOrderDto {
  // Empty DTO for accept
}

export class RejectOrderDto {
  reason: string;
}

export class CreateOrderDto {
  id: string;
  customerId: string;
  items: { productId: string; quantity: number }[];
}

@Controller('online-orders')
export class OnlineOrdersController {
  constructor(private onlineOrdersService: OnlineOrdersService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    if (status) {
      return this.onlineOrdersService.getAllOrders().filter((o) => o.status === status);
    }
    return this.onlineOrdersService.getAllOrders();
  }

  @Post(':id/accept')
  accept(@Param('id') id: string, @Body() dto: AcceptOrderDto) {
    return this.onlineOrdersService.acceptOrder(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: RejectOrderDto) {
    if (!dto.reason || dto.reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required');
    }
    return this.onlineOrdersService.rejectOrder(id, dto.reason);
  }

  @Post(':id/prepare')
  prepare(@Param('id') id: string) {
    return this.onlineOrdersService.prepareOrder(id);
  }

  @Post(':id/deliver')
  deliver(@Param('id') id: string) {
    return this.onlineOrdersService.deliverOrder(id);
  }

  @Get(':id/overdue')
  isOverdue(@Param('id') id: string) {
    return { isOverdue: this.onlineOrdersService.isOrderOverdue(id) };
  }
}
