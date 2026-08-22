import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { IPlatformAdapter, OrderItem } from './base.adapter';

@Injectable()
export class ShopeeAdapter implements IPlatformAdapter {
  private readonly platform: 'SHOPEE' = 'SHOPEE';
  private readonly platformFeeRate = 0.15; // Default 15%

  parse(file: Buffer): OrderItem[] {
    const workbook = xlsx.read(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // First sheet only

    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    if (rows.length < 2) return [];

    const header = rows[0] as any[];
    const dataRows = rows.slice(1) as any[][];

    const orderMap = new Map<string, OrderItem>();

    for (const row of dataRows) {
      const rowObj = this.rowToObj(header, row as any[]);
      const orderNo = rowObj['Order No'] || rowObj['Order No.'] || rowObj['OrderID'] || rowObj['order_no'];
      const productName = rowObj['Item Name'] || rowObj['Item Name'] || rowObj['Product'] || rowObj['product'];
      const quantityStr = rowObj['Item Quantity'] || rowObj['Qty'] || rowObj['quantity'];
      const priceStr = rowObj['Item Price'] || rowObj['Price'] || rowObj['price'];

      const quantity = parseInt(quantityStr, 10) || 1;
      const price = parseFloat(priceStr) * 100 || 0; // Convert to integer VNĐ

      const orderKey = orderNo.toString();
      if (!orderMap.has(orderKey)) {
        orderMap.set(orderKey, {
          orderNo: orderNo.toString(),
          product: productName.toString(),
          quantity,
          price: Math.round(price),
          platformFeeRate: this.platformFeeRate,
          platform: this.platform,
        });
      }
    }

    return Array.from(orderMap.values());
  }

  private rowToObj(header: any[], row: any[]): Record<string, string> {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h.toString()] = row[i]?.toString() || '';
    });
    return obj;
  }
}
