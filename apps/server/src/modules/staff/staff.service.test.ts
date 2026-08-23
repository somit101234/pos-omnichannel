import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StaffService } from './staff.service';

// Mock Prisma user operations
type MockUser = {
  id: string;
  username: string;
  role: 'OWNER' | 'ADMIN' | 'CASHIER';
  storeId: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: Date;
  loginAttempts: number;
  passwordHash: string;
};

class MockPrisma {
  public users: MockUser[] = [];
  public user = {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  };
}

describe('StaffService', () => {
  let service: StaffService;
  let mockPrisma: MockPrisma;

  beforeEach(() => {
    mockPrisma = new MockPrisma();
    service = new StaffService(mockPrisma as any);
  });

  // Helper to reset mock implementation
  const resetPrisma = () => {
    mockPrisma.user.create.mockClear();
    mockPrisma.user.findMany.mockClear();
    mockPrisma.user.update.mockClear();
  };

  describe('AC1 — Create staff', () => {
    it('should create a new staff with role', async () => {
      resetPrisma();
      const createdUser: MockUser = {
        id: 'user-1',
        username: 'staff1',
        role: 'ADMIN',
        storeId: 'store-1',
        email: 'staff1@example.com',
        phone: '0123456789',
        isActive: true,
        createdAt: new Date(),
        loginAttempts: 0,
        passwordHash: 'hashed-pass',
      };
      mockPrisma.user.create.mockResolvedValue(createdUser);

      const result = await service.createStaff({
        username: 'staff1',
        passwordHash: 'hashed-pass',
        role: 'ADMIN',
        storeId: 'store-1',
        email: 'staff1@example.com',
        phone: '0123456789',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(result.username).toBe('staff1');
      expect(result.role).toBe('ADMIN');
      expect(result.storeId).toBe('store-1');
      expect(result.isActive).toBe(true);
    });
  });

  describe('AC2 — List staff', () => {
    it('should return list of staff with role badges', async () => {
      resetPrisma();
      const staffList: MockUser[] = [
        {
          id: 'user-1',
          username: 'staff1',
          role: 'ADMIN',
          storeId: 'store-1',
          email: 'staff1@example.com',
          phone: '0123456789',
          isActive: true,
          createdAt: new Date(),
          loginAttempts: 0,
          passwordHash: 'hashed-pass',
        },
        {
          id: 'user-2',
          username: 'staff2',
          role: 'CASHIER',
          storeId: 'store-1',
          isActive: true,
          createdAt: new Date(),
          loginAttempts: 0,
          passwordHash: 'hashed-pass',
        },
      ];
      mockPrisma.user.findMany.mockResolvedValue(staffList);

      const result = await service.getStaffList('store-1', 'ADMIN');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].role).toBe('ADMIN');
      expect(result[1].role).toBe('CASHIER');
    });

    it('should throw error if CASHIER tries to view staff list', async () => {
      await expect(service.getStaffList('store-1', 'CASHIER')).rejects.toThrow(
        'CASHIER does not have permission to view staff list'
      );
    });
  });

  describe('AC3 — Assign role', () => {
    it('should update staff role', async () => {
      resetPrisma();
      const updatedUser: MockUser = {
        id: 'user-1',
        username: 'staff1',
        role: 'OWNER',
        storeId: 'store-1',
        isActive: true,
        createdAt: new Date(),
        loginAttempts: 0,
        passwordHash: 'hashed-pass',
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateStaffRole('user-1', 'OWNER');

      expect(result.role).toBe('OWNER');
    });
  });

  describe('AC4 — Soft delete', () => {
    it('should deactivate staff (isActive=false)', async () => {
      resetPrisma();
      const updatedUser: MockUser = {
        id: 'user-1',
        username: 'staff1',
        role: 'ADMIN',
        storeId: 'store-1',
        isActive: false,
        createdAt: new Date(),
        loginAttempts: 0,
        passwordHash: 'hashed-pass',
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.deleteStaff('user-1');

      expect(result.isActive).toBe(false);
    });
  });

  describe('AC5 — Reactivate', () => {
    it('should reactivate staff (isActive=true)', async () => {
      resetPrisma();
      const updatedUser: MockUser = {
        id: 'user-1',
        username: 'staff1',
        role: 'ADMIN',
        storeId: 'store-1',
        isActive: true,
        createdAt: new Date(),
        loginAttempts: 0,
        passwordHash: 'hashed-pass',
      };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.reactivateStaff('user-1');

      expect(result.isActive).toBe(true);
    });
  });
});
