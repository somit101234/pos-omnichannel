import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { ReportsService, TransactionInput, DateRange } from './reports.service';

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface CreateTransactionDto {
  storeId: string;
  total: number; // bigint as number, will be converted
  platformFeeRate?: number;
  items?: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

export interface DashboardResponse {
  todayRevenue: string;
  orderCount: number;
  topProducts: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: string;
  }>;
}

export interface RevenueReportResponse {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  totalRevenue: string;
  platformFee: string;
  netRevenue: string;
}

export interface ProfitReportResponse {
  totalRevenue: string;
  totalCost: string;
  totalPlatformFee: string;
  totalProfit: string;
}

// ── Controller ────────────────────────────────────────────────────────────

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ── Dashboard KPIs ──────────────────────────────────────────────────────

  @Get('dashboard/:storeId')
  getDashboard(@Param('storeId') storeId: string): DashboardResponse {
    const kpis = this.reportsService.getDashboardKpis(storeId);
    return {
      todayRevenue: kpis.todayRevenue.toString(),
      orderCount: kpis.orderCount,
      topProducts: kpis.topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        quantity: p.quantity,
        revenue: p.revenue.toString(),
      })),
    };
  }

  // ── Revenue Report ──────────────────────────────────────────────────────

  @Get('revenue/:storeId')
  getRevenueReport(
    @Param('storeId') storeId: string,
    @Query('start') startDateStr?: string,
    @Query('end') endDateStr?: string,
    @Query('period') period?: 'day' | 'week' | 'month'
  ): RevenueReportResponse {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr
      ? new Date(endDateStr)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    if (!period) {
      // Auto-detect period based on date range
      const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays <= 1) period = 'day';
      else if (diffDays <= 7) period = 'week';
      else period = 'month';
    }

    const report = this.reportsService.getRevenueReport(storeId, {
      startDate,
      endDate,
      period,
    });

    return {
      period: report.period,
      startDate: report.startDate.toISOString(),
      endDate: report.endDate.toISOString(),
      totalRevenue: report.totalRevenue.toString(),
      platformFee: report.platformFee.toString(),
      netRevenue: report.netRevenue.toString(),
    };
  }

  // ── Profit Report ───────────────────────────────────────────────────────

  @Get('profit/:storeId')
  getProfitReport(
    @Param('storeId') storeId: string,
    @Query('start') startDateStr?: string,
    @Query('end') endDateStr?: string
  ): ProfitReportResponse {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr
      ? new Date(endDateStr)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    const report = this.reportsService.getProfitReport(storeId, {
      startDate,
      endDate,
      period: 'day', // Default to day for profit report
    });

    return {
      totalRevenue: report.totalRevenue.toString(),
      totalCost: report.totalCost.toString(),
      totalPlatformFee: report.totalPlatformFee.toString(),
      totalProfit: report.totalProfit.toString(),
    };
  }

  // ── Transaction Creation (for testing) ───────────────────────────────────

  @Post('transactions')
  createTransaction(@Body() dto: CreateTransactionDto): { id: string } {
    const transactionInput: TransactionInput = {
      storeId: dto.storeId,
      total: BigInt(dto.total),
      platformFeeRate: dto.platformFeeRate,
      items: dto.items?.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: BigInt(item.price),
      })),
    };
    const id = this.reportsService.createTransaction(transactionInput);
    return { id };
  }

  // ── Excel Export ────────────────────────────────────────────────────────

  @Get('export/revenue/:storeId')
  exportRevenueExcel(
    @Param('storeId') storeId: string,
    @Query('start') startDateStr?: string,
    @Query('end') endDateStr?: string
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr
      ? new Date(endDateStr)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    const buffer = this.reportsService.exportRevenueToExcel(storeId, {
      startDate,
      endDate,
      period: 'day',
    });

    return {
      filename: `revenue_${startDateStr || 'today'}.xlsx`,
      data: buffer.toString('base64'),
    };
  }

  @Get('export/profit/:storeId')
  exportProfitExcel(
    @Param('storeId') storeId: string,
    @Query('start') startDateStr?: string,
    @Query('end') endDateStr?: string
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    const endDate = endDateStr
      ? new Date(endDateStr)
      : new Date(startDate.getTime() + 24 * 60 * 60 * 1000 - 1);

    const buffer = this.reportsService.exportProfitToExcel(storeId, {
      startDate,
      endDate,
      period: 'day',
    });

    return {
      filename: `profit_${startDateStr || 'today'}.xlsx`,
      data: buffer.toString('base64'),
    };
  }
}
