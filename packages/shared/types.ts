// Shared types for POS Omnichannel monorepo
// Mirrors Prisma generated types + additional domain types

export type Role = 'OWNER' | 'ADMIN' | 'CASHIER';

export type TransactionType = 'SALE' | 'PURCHASE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'E_WALLET';
export type Platform = 'SHOPEE' | 'GRABFOOD' | 'BEOFORD';
export type OnlineOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PurchaseOrderStatus = 'DRAFT' | 'CONFIRMED' | 'RECEIVED' | 'CANCELLED';
export type ShiftStatus = 'OPEN' | 'CLOSED' | 'INTERRUPTED';
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'TRANSFER';
export type AuditEntityType = 'USER' | 'PRODUCT' | 'STORE' | 'TRANSACTION' | 'CATEGORY' | 'STOCK' | 'SUPPLIER' | 'PURCHASE_ORDER' | 'SHIFT' | 'ONLINE_ORDER';

// Currency: store as integer cents (BIGINT in Prisma) to avoid floating point errors
export type Amount = number; // stored in cents

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface StoreContext {
  storeId: string;
  userId: string;
  role: Role;
}
