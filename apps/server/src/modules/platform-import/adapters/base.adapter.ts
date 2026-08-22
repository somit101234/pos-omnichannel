export type PlatformType = 'SHOPEE' | 'GRABFOOD' | 'BEOFORD';

export interface OrderItem {
  orderNo: string;
  product: string;
  quantity: number;
  price: number;
  platformFeeRate: number;
  platform: PlatformType;
}

export interface IPlatformAdapter {
  parse(file: Buffer): OrderItem[];
}
