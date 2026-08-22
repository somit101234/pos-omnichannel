import { Injectable } from '@nestjs/common';
import * as xlsx from 'xlsx';
import { IPlatformAdapter, OrderItem } from './base.adapter';

@Injectable()
export class GrabFoodAdapter implements IPlatformAdapter {
  private readonly platform: 'GRABFOOD' = 'GRABFOOD';
  private readonly platformFeeRate = 0.20; // Default 20%

  parse(file: Buffer): OrderItem[] {
    const workbook = xlsx.read(file);
    const ordersSheet = workbook.Sheets['Orders'];
    const itemsSheet = workbook.Sheets['Items'];

    if (!ordersSheet || !itemsSheet) {
      throw new Error('GrabFood Excel must contain "Orders" and "Items" sheets');
    }

    const orders = xlsx.utils.sheet_to_json(ordersSheet, { header: 1 }) as any[][];
    const items = xlsx.utils.sheet_to_json(itemsSheet, { header: 1 }) as any[][];

    if (orders.length < 2 || items.length < 2) return [];

    const orderHeader = orders[0];
    const itemHeader = items[0];
    const orderData = orders.slice(1);
    const itemData = items.slice(1);

    const orderMap = new Map<string, string>(); // orderNo -> customerName
    for (const row of orderData) {
      const rowObj = this.rowToObj(orderHeader, row);
      const orderNo = rowObj['Order Number'] || rowObj['OrderNo'] || rowObj['order_no'];
      if (orderNo) {
        orderMap.set(orderNo.toString(), orderNo.toString());
      }
    }

    const orderItems: OrderItem[] = [];
    for (const row of itemData) {
      const rowObj = this.rowToObj(itemHeader, row);
      const orderNo = rowObj['Order Number'] || rowObj['OrderNo'] || rowObj['order_no'];
      const productName = rowObj['Item Name'] || rowObj['Product Name'] || rowObj['product'];
      const quantityStr = rowObj['Quantity'] || rowObj['qty'];
      const priceStr = rowObj['Item Price'] || rowObj['Price'] || rowObj['price'];

      const quantity = parseInt(quantityStr, 10) || 1;
      const price = parseFloat(priceStr) * 100 || 0; // Convert to integer VNĐ

      if (orderNo && orderMap.has(orderNo.toString())) {
        orderItems.push({
          orderNo: orderNo.toString(),
          product: productName.toString(),
          quantity,
          price: Math.round(price),
          platformFeeRate: this.platformFeeRate,
          platform: this.platform,
        });
      }
    }

    return orderItems;
  }

  private rowToObj(header: any[], row: any[]): Record<string, string> {
    const obj: Record<string, string> = {};
    header.forEach((h, i) => {
      obj[h.toString()] = row[i]?.toString() || '';
    });
    return obj;
  }
}
