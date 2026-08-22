export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface StoreConfig {
  taxDefault?: number;
  currency?: string;
}
