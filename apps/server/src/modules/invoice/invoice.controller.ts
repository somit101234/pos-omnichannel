import { Controller, Get, Param, Query } from '@nestjs/common';
import { InvoiceService, Transaction, ReceiptFormat } from './invoice.service';

/**
 * Invoice/Receipt controller.
 *
 * Endpoints:
 * - GET /api/invoice/receipt/:orderId?format=58mm|80mm&reprint=false
 *   → Generate receipt for given OrderID
 */
@Controller('api/invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Get('receipt/:orderId')
  async generateReceipt(
    @Param('orderId') orderId: string,
    @Query('format') format: '58mm' | '80mm' = '58mm',
    @Query('reprint') reprint: string = 'false'
  ): Promise<string> {
    const formatEnum = format === '58mm' ? ReceiptFormat.W58 : ReceiptFormat.W80;
    const isReprint = reprint === 'true';

    const tx = await this.invoiceService.getReceiptData(orderId);
    if (!tx) {
      throw new Error(`Receipt for order ${orderId} not found`);
    }
    return this.invoiceService.generateReceipt(tx, formatEnum, isReprint);
  }
}
