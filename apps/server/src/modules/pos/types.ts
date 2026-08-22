// ── Types ───────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  barcode: string;
  costPrice: bigint;
  salePrice: bigint;
  minStock: number;
  isBom: boolean;
  unit: string;
}

export interface Stock {
  productId: string;
  warehouseId: string;
  quantity: number;
}

export interface BomIngredient {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: bigint;
  conversionRate: number;
  subtotal: bigint;
}

export interface BomItem {
  bomProductId: string;
  ingredientProductId: string;
  quantity: number;
  conversionRate: number;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: bigint;
  subtotal: bigint;
}

export interface Transaction {
  id: string;
  storeId: string;
  cashierId: string;
  type: 'SALE';
  status: 'COMPLETED';
  total: bigint;
  paymentMethod: 'CASH' | 'CARD';
  createdAt: Date;
  items: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: bigint;
  subtotal: bigint;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  warehouseId: string;
}

export interface CheckoutRequest {
  productId: string;
  quantity: number;
  warehouseId: string;
  paymentMethod: 'CASH' | 'CARD';
}

export interface PosDependencyInjection {
  stockGetter: (productId: string, warehouseId: string) => Stock | undefined;
  productGetter: (id: string) => Product | undefined;
  bomGetter: () => BomItem[];
}
