import { Injectable } from '@nestjs/common';

// ── DTOs ──────────────────────────────────────────────────────────────────

export enum ReceiptFormat {
  W58 = '58mm',
  W80 = '80mm',
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  price: bigint; // cents
  subtotal: bigint; // cents
}

/**
 * Transaction interface from T002P (POS module).
 * Consumes: Transaction from T002P. Produces: receipt text.
 */
export interface Transaction {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeTaxCode: string;
  items: ReceiptItem[];
  total: bigint; // cents
  cash: bigint; // cents
  change: bigint; // cents
  platform: 'POS' | 'SHOPEE' | 'GRABFOOD' | 'BEOFORD';
  createdAt: string;
}

// ── Invoice Service ───────────────────────────────────────────────────────

/**
 * Invoice service — generates thermal receipt templates.
 *
 * Supports 58mm and 80mm receipt formats.
 * Reprint endpoint: GET /api/receipts/:orderId returns receipt data.
 */
@Injectable()
export class InvoiceService {
  private readonly MAX_WIDTH_58 = 32; // characters per line for 58mm paper
  private readonly MAX_WIDTH_80 = 48; // characters per line for 80mm paper

  // ── Receipt generation ────────────────────────────────────────────────

  /**
   * Generate a plain text receipt for thermal printer.
   *
   * @param tx - Transaction object from POS module
   * @param format - Paper width (58mm or 80mm)
   * @param isReprint - Flag to indicate reprint (adds "SAO LƯU" marker)
   * @returns Plain text receipt ready for thermal printer
   */
  generateReceipt(
    tx: Transaction,
    format: ReceiptFormat,
    isReprint = false
  ): string {
    const maxWidth = format === ReceiptFormat.W58 ? this.MAX_WIDTH_58 : this.MAX_WIDTH_80;

    const lines: string[] = [];

    // Header: Store info
    lines.push('═'.repeat(maxWidth));
    lines.push(this._center(tx.storeName, maxWidth));
    lines.push(this._center(tx.storeAddress, maxWidth));
    lines.push(this._center(`MST: ${tx.storeTaxCode}`, maxWidth));
    lines.push('─'.repeat(maxWidth));

    // Transaction info
    lines.push(`Mã HD: ${tx.orderId}`);
    lines.push(`Ngày: ${tx.createdAt}`);
    if (tx.platform !== 'POS') {
      lines.push(`Nền tảng: ${tx.platform}`);
    }
    if (isReprint) {
      lines.push('--- SAO LƯU ---');
    }
    lines.push('═'.repeat(maxWidth));

    // Items
    for (const item of tx.items) {
      const qtyStr = item.quantity.toString();
      const priceStr = this._formatCurrency(item.price);
      const subtotalStr = this._formatCurrency(item.subtotal);
      const line = `${item.productName.substring(0, maxWidth - 20)}  ${qtyStr} x ${priceStr} = ${subtotalStr}`;
      lines.push(this._truncate(line, maxWidth));
    }

    lines.push('─'.repeat(maxWidth));

    // Totals
    lines.push(this._rightJustify('Tổng cộng:', maxWidth - 12) + this._formatCurrency(tx.total, 12));
    lines.push(this._rightJustify('Tiền mặt:', maxWidth - 12) + this._formatCurrency(tx.cash, 12));
    lines.push(this._rightJustify('Tiền thừa:', maxWidth - 12) + this._formatCurrency(tx.change, 12));

    lines.push('═'.repeat(maxWidth));
    lines.push(this._center('Cảm ơn quý khách!', maxWidth));
    lines.push(this._center('Hẹn gặp lại!', maxWidth));
    lines.push('═'.repeat(maxWidth));

    return lines.join('\n');
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private _center(text: string, width: number): string {
    return text.padStart(Math.floor((width + text.length) / 2)).padEnd(width);
  }

  private _rightJustify(text: string, width: number): string {
    return text.padStart(width);
  }

  private _truncate(text: string, width: number): string {
    if (text.length <= width) return text;
    return text.substring(0, width - 3) + '...';
  }

  private _formatCurrency(amount: bigint, width: number = 0): string {
    const formatted = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return width > 0 ? formatted.padStart(width) : formatted;
  }

  // ── Reprint endpoint simulation ────────────────────────────────────────

  /**
   * Simulate GET /api/receipts/:orderId endpoint.
   * In real implementation, this would fetch from database.
   */
  async getReceiptData(orderId: string): Promise<Transaction | null> {
    // Mock transaction for now — replace with real DB lookup when T002P integration is ready
    return {
      id: `txn_mock_${orderId}`,
      orderId,
      storeId: 'store_hcm',
      storeName: 'Cháo ếch Bà Xanh',
      storeAddress: '123 Le Loi, Q1, HCMC',
      storeTaxCode: '0123456789',
      items: [
        { productName: 'Cháo ếch', quantity: 2, price: 75000n, subtotal: 150000n },
        { productName: 'Nước mắm', quantity: 1, price: 20000n, subtotal: 20000n },
      ],
      total: 170000n,
      cash: 200000n,
      change: 30000n,
      platform: 'POS',
      createdAt: '2026-08-22 20:30:00',
    };
  }
}
