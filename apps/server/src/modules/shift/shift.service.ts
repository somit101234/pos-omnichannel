// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Shift, User } from '@prisma/client';

export interface StartShiftDto {
  storeId: string;
  userId: string;
}

export interface EndShiftDto {
  userId?: string;
  role?: string;
}

export interface ForceCloseShiftDto {
  userId: string;
  role: string;
}

export interface ShiftWithDetails {
  id: string;
  storeId: string;
  userId: string;
  status: 'ACTIVE' | 'COMPLETED';
  startedAt: Date;
  endedAt: Date | null;
  forceClosedAt: Date | null;
  duration?: number;
  isLongShift?: boolean;
}

@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  async start(dto: StartShiftDto): Promise<ShiftWithDetails> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    const shift = await this.prisma.shift.create({
      data: {
        storeId: dto.storeId,
        userId: dto.userId,
        status: 'ACTIVE',
        startedAt: new Date(),
      },
    });

    return this.enrichShift(shift);
  }

  async end(shiftId: string, dto?: EndShiftDto): Promise<ShiftWithDetails> {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException(`Shift ${shiftId} not found`);
    }

    if (shift.status !== 'ACTIVE') {
      throw new BadRequestException('Shift is not ACTIVE, cannot end');
    }

    const updatedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
      },
    });

    const duration = (updatedShift.endedAt.getTime() - shift.startedAt.getTime()) / 1000; // seconds

    return this.enrichShift(updatedShift, duration);
  }

  async forceClose(shiftId: string, dto: ForceCloseShiftDto): Promise<ShiftWithDetails> {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException(`Shift ${shiftId} not found`);
    }

    if (shift.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot force-close non-ACTIVE shift');
    }

    // Check if user is MANAGER or OWNER
    if (dto.role !== 'MANAGER' && dto.role !== 'OWNER') {
      throw new BadRequestException('Only MANAGER or OWNER can force-close a shift');
    }

    const updatedShift = await this.prisma.shift.update({
      where: { id: shiftId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        forceClosedAt: new Date(),
      },
    });

    const duration = (updatedShift.endedAt.getTime() - shift.startedAt.getTime()) / 1000; // seconds

    return this.enrichShift(updatedShift, duration);
  }

  async get(shiftId: string): Promise<ShiftWithDetails> {
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId },
    });

    if (!shift) {
      throw new NotFoundException(`Shift ${shiftId} not found`);
    }

    return this.enrichShift(shift);
  }

  async findAll(storeId: string): Promise<ShiftWithDetails[]> {
    const shifts = await this.prisma.shift.findMany({
      where: { storeId },
      orderBy: [{ startedAt: 'desc' }],
    });

    return shifts.map((shift) => this.enrichShift(shift));
  }

  /**
   * Enrich shift with duration and isLongShift flag
   * - duration: seconds between startedAt and endedAt (or now if ACTIVE)
   * - isLongShift: true if duration > 8 hours (28800 seconds)
   */
  private enrichShift(shift: Shift, overrideDuration?: number): ShiftWithDetails {
    const now = new Date();
    const startTime = shift.startedAt.getTime();
    const endTime = shift.endedAt ? shift.endedAt.getTime() : now.getTime();
    const duration = overrideDuration ?? (endTime - startTime) / 1000;

    return {
      id: shift.id,
      storeId: shift.storeId,
      userId: shift.userId,
      status: shift.status,
      startedAt: shift.startedAt,
      endedAt: shift.endedAt,
      forceClosedAt: shift.forceClosedAt,
      duration,
      isLongShift: duration > 8 * 60 * 60, // > 8 hours
    };
  }
}
