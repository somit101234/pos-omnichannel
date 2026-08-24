import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ShiftService } from './shift.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Shift } from '@prisma/client';

// Mock PrismaService với correct structure
const mockPrisma = {
  shift: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

describe('ShiftService', () => {
  let service: ShiftService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ShiftService(mockPrisma as any);
  });

  // ===== AC1: Start shift -> status ACTIVE =====
  describe('AC1 — Start shift', () => {
    it('should create shift with status ACTIVE and return it', async () => {
      const mockShift = {
        id: 'shift_1',
        storeId: 'store_1',
        userId: 'user_1',
        status: 'ACTIVE',
        startedAt: new Date('2026-08-23T10:00:00Z'),
        endedAt: null,
        forceClosedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user_1', role: 'CASHIER' });
      mockPrisma.shift.create.mockResolvedValue(mockShift);

      const result = await service.start({
        storeId: 'store_1',
        userId: 'user_1',
      });

      const shiftResult = result as any;
      expect(shiftResult.status).toBe('ACTIVE');
      expect(shiftResult.startedAt).toBeDefined();
      expect(shiftResult.endedAt).toBeNull();
      expect(mockPrisma.shift.create).toHaveBeenCalledWith({
        data: {
          storeId: 'store_1',
          userId: 'user_1',
          status: 'ACTIVE',
          startedAt: expect.any(Date),
        },
      });
    });

    it('should reject if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.start({ storeId: 'store_1', userId: 'nonexistent_user' })
      ).rejects.toThrow(/User .* not found/);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent_user' },
      });
    });
  });

  // ===== AC2: End shift -> status COMPLETED, duration calculated =====
  describe('AC2 — End shift', () => {
    it('should end ACTIVE shift and calculate duration', async () => {
      const now = new Date('2026-08-23T14:30:00Z');
      const startedAt = new Date('2026-08-23T10:00:00Z');
      const mockShift = {
        id: 'shift_1',
        storeId: 'store_1',
        userId: 'user_1',
        status: 'ACTIVE',
        startedAt,
        endedAt: null,
        forceClosedAt: null,
      };
      const updatedShift = { ...mockShift, status: 'COMPLETED', endedAt: now };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);
      mockPrisma.shift.update.mockResolvedValue(updatedShift);

      const result = await service.end('shift_1');
      const shiftResult = result as any;

      expect(shiftResult.status).toBe('COMPLETED');
      expect(shiftResult.endedAt).toEqual(now);
      // Duration should be ~4.5 hours (16200 seconds)
      expect(shiftResult.duration).toBeCloseTo(16200, -1); // allow ±10 seconds
      expect(mockPrisma.shift.update).toHaveBeenCalledWith({
        where: { id: 'shift_1' },
        data: {
          status: 'COMPLETED',
          endedAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException if shift is not ACTIVE', async () => {
      const mockShift = {
        id: 'shift_1',
        status: 'COMPLETED',
        startedAt: new Date('2026-08-23T10:00:00Z'),
        endedAt: new Date('2026-08-23T14:00:00Z'),
      };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);

      await expect(service.end('shift_1')).rejects.toThrow(
        'Shift is not ACTIVE, cannot end',
      );
    });

    it('should throw NotFoundException if shift not found', async () => {
      mockPrisma.shift.findFirst.mockResolvedValue(null);

      await expect(service.end('nonexistent_shift')).rejects.toThrow(
        'Shift nonexistent_shift not found',
      );
    });
  });

  // ===== AC3: Force-close any ACTIVE shift (manager/owner only) =====
  describe('AC3 — Force-close shift', () => {
    it('should force-close ACTIVE shift and mark as forced', async () => {
      const mockShift = {
        id: 'shift_1',
        storeId: 'store_1',
        userId: 'user_1',
        status: 'ACTIVE',
        startedAt: new Date('2026-08-23T10:00:00Z'),
        endedAt: null,
        forceClosedAt: null,
      };
      const now = new Date('2026-08-23T14:00:00Z');
      const updatedShift = {
        ...mockShift,
        status: 'COMPLETED',
        forceClosedAt: now,
        endedAt: now,
      };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);
      mockPrisma.shift.update.mockResolvedValue(updatedShift);

      const result = await service.forceClose('shift_1', {
        userId: 'manager_1',
        role: 'MANAGER',
      });

      expect(result.status).toBe('COMPLETED');
      expect(result.forceClosedAt).toEqual(now);
      expect(result.endedAt).toEqual(now);
      expect(mockPrisma.shift.update).toHaveBeenCalledWith({
        where: { id: 'shift_1' },
        data: {
          status: 'COMPLETED',
          endedAt: expect.any(Date),
          forceClosedAt: expect.any(Date),
        },
      });
    });

    it('should allow OWNER to force-close shift', async () => {
      const mockShift = {
        id: 'shift_1',
        status: 'ACTIVE',
        startedAt: new Date('2026-08-23T10:00:00Z'),
      };
      const updatedShift = { ...mockShift, status: 'COMPLETED', endedAt: new Date() };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);
      mockPrisma.shift.update.mockResolvedValue(updatedShift);

      const result = await service.forceClose('shift_1', {
        userId: 'owner_1',
        role: 'OWNER',
      });

      expect(result.status).toBe('COMPLETED');
    });

    it('should throw BadRequestException if shift is not ACTIVE', async () => {
      const mockShift = {
        id: 'shift_1',
        status: 'COMPLETED',
      };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);

      await expect(
        service.forceClose('shift_1', { userId: 'manager_1', role: 'MANAGER' })
      ).rejects.toThrow('Cannot force-close non-ACTIVE shift');
    });

    it('should throw NotFoundException if shift not found', async () => {
      mockPrisma.shift.findFirst.mockResolvedValue(null);

      await expect(
        service.forceClose('nonexistent', { userId: 'manager_1', role: 'MANAGER' })
      ).rejects.toThrow('Shift nonexistent not found');
    });

    it('should throw BadRequestException if user is not manager/owner', async () => {
      const mockShift = {
        id: 'shift_1',
        status: 'ACTIVE',
      };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);

      await expect(
        service.forceClose('shift_1', { userId: 'cashier_1', role: 'CASHIER' })
      ).rejects.toThrow('Only MANAGER or OWNER can force-close a shift');
    });
  });

  // ===== AC4: Alert when shift > 8 hours =====
  describe('AC4 — 8-hour alert', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-08-23T11:02:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return isLongShift=true when shift duration > 8 hours', async () => {
      // Mock shift started at 00:00, now is ~11:02 → duration ~11 hours > 8
      const mockShift = {
        id: 'shift_1',
        status: 'ACTIVE',
        startedAt: new Date('2026-08-23T00:00:00Z'),
        endedAt: null,
      };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);
      const result = await service.get('shift_1');
      const shiftResult = result as any;

      expect(shiftResult.isLongShift).toBe(true);
    });

    it('should return isLongShift=false when shift duration <= 8 hours', async () => {
      // Mock shift started at 10:00, now is ~11:02 → duration ~1 hour < 8
      const mockShift = {
        id: 'shift_1',
        status: 'ACTIVE',
        startedAt: new Date('2026-08-23T10:00:00Z'),
        endedAt: null,
      };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);
      const result = await service.get('shift_1');
      const shiftResult = result as any;

      expect(shiftResult.isLongShift).toBe(false);
    });

    it('should return isLongShift=false for completed shift < 8 hours', async () => {
      // Mock shift: 10:00 -> 14:00 = 4 hours < 8
      const mockShift = {
        id: 'shift_1',
        status: 'COMPLETED',
        startedAt: new Date('2026-08-23T10:00:00Z'),
        endedAt: new Date('2026-08-23T14:00:00Z'),
      };

      mockPrisma.shift.findFirst.mockResolvedValue(mockShift);
      const result = await service.get('shift_1');
      const shiftResult = result as any;

      expect(shiftResult.isLongShift).toBe(false);
    });

    it('should throw NotFoundException if shift not found', async () => {
      mockPrisma.shift.findFirst.mockResolvedValue(null);

      await expect(service.get('nonexistent_shift')).rejects.toThrow(
        'Shift nonexistent_shift not found',
      );
    });
  });

  // ===== Utility: Find all shifts for store =====
  describe('Utility — Find all shifts for store', () => {
    it('should return all shifts for a store', async () => {
      const mockShifts = [
        {
          id: 'shift_1',
          storeId: 'store_1',
          userId: 'user_1',
          status: 'ACTIVE',
          startedAt: new Date('2026-08-23T10:00:00Z'),
        },
        {
          id: 'shift_2',
          storeId: 'store_1',
          userId: 'user_2',
          status: 'COMPLETED',
          startedAt: new Date('2026-08-23T02:00:00Z'),
          endedAt: new Date('2026-08-23T10:00:00Z'),
        },
      ];

      mockPrisma.shift.findMany.mockResolvedValue(mockShifts);

      const result = await service.findAll('store_1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].status).toBe('ACTIVE');
      expect(result[1].status).toBe('COMPLETED');
    });

    it('should return empty array for store with no shifts', async () => {
      mockPrisma.shift.findMany.mockResolvedValue([]);

      const result = await service.findAll('nonexistent_store');

      expect(result).toEqual([]);
    });
  });

  // ===== Negative / Edge cases =====
  describe('Negative / Edge cases', () => {
    it('should handle multiple concurrent ACTIVE shifts for different users', async () => {
      const shift1 = {
        id: 'shift_1',
        storeId: 'store_1',
        userId: 'user_1',
        status: 'ACTIVE',
        startedAt: new Date('2026-08-23T10:00:00Z'),
      };
      const shift2 = {
        id: 'shift_2',
        storeId: 'store_1',
        userId: 'user_2',
        status: 'ACTIVE',
        startedAt: new Date('2026-08-23T11:00:00Z'),
      };

      // Mock user existence checks
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'user_1', role: 'CASHIER' })
        .mockResolvedValueOnce({ id: 'user_2', role: 'CASHIER' });

      mockPrisma.shift.create
        .mockResolvedValueOnce(shift1)
        .mockResolvedValueOnce(shift2);

      const result1 = await service.start({ storeId: 'store_1', userId: 'user_1' });
      const result2 = await service.start({ storeId: 'store_1', userId: 'user_2' });

      // Cast to Shift type to access properties
      expect((result1 as any).id).toBe('shift_1');
      expect((result2 as any).id).toBe('shift_2');
      expect((result1 as any).userId).toBe('user_1');
      expect((result2 as any).userId).toBe('user_2');
    });

    it('should allow ending one shift while another ACTIVE shift exists for same store', async () => {
      // FIX: completedShift must be ACTIVE for this test to make sense
      const completedShift = {
        id: 'shift_1',
        storeId: 'store_1',
        userId: 'user_1',
        status: 'ACTIVE' as const,
        startedAt: new Date('2026-08-23T10:00:00Z'),
        endedAt: null,
        forceClosedAt: null,
      };
      const activeShift = {
        id: 'shift_2',
        storeId: 'store_1',
        userId: 'user_2',
        status: 'ACTIVE' as const,
        startedAt: new Date('2026-08-23T14:00:00Z'),
        endedAt: null,
        forceClosedAt: null,
      };

      mockPrisma.shift.findFirst
        .mockResolvedValueOnce(completedShift)
        .mockResolvedValueOnce(activeShift);
      mockPrisma.shift.update
        .mockResolvedValueOnce({ ...completedShift, status: 'COMPLETED', endedAt: new Date('2026-08-23T14:00:00Z') })
        .mockResolvedValueOnce({ ...activeShift, status: 'COMPLETED', endedAt: new Date('2026-08-23T15:00:00Z') });

      const result = await service.end('shift_1');
      expect((result as any).status).toBe('COMPLETED');

      // Now try to end the active shift
      const result2 = await service.end('shift_2');
      expect((result2 as any).status).toBe('COMPLETED');
    });
  });
});
