export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export type User = {
  id: string;
  username: string;
  role: UserRole;
  storeId?: string;
};
