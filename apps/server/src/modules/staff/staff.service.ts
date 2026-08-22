import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async createStaff(data: {
    username: string;
    passwordHash: string;
    role: 'OWNER' | 'ADMIN' | 'CASHIER';
    storeId: string;
    email?: string;
    phone?: string;
  }) {
    const staff = await this.prisma.user.create({
      data: {
        username: data.username,
        passwordHash: data.passwordHash,
        role: data.role,
        storeId: data.storeId,
        email: data.email,
        phone: data.phone,
        loginAttempts: 0,
        isActive: true,
      },
    });

    return {
      id: staff.id,
      username: staff.username,
      role: staff.role,
      storeId: staff.storeId,
      isActive: staff.isActive,
    };
  }

  async getStaffList(storeId: string, viewerRole: 'OWNER' | 'ADMIN' | 'CASHIER') {
    if (viewerRole === 'CASHIER') {
      throw new Error('CASHIER does not have permission to view staff list');
    }

    const staffList = await this.prisma.user.findMany({
      where: {
        storeId,
        isActive: true,
      },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    return staffList;
  }

  async updateStaffRole(staffId: string, newRole: 'OWNER' | 'ADMIN' | 'CASHIER') {
    const staff = await this.prisma.user.update({
      where: { id: staffId },
      data: { role: newRole },
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    return staff;
  }

  async deleteStaff(staffId: string) {
    const staff = await this.prisma.user.update({
      where: { id: staffId },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        isActive: true,
      },
    });

    return staff;
  }

  async reactivateStaff(staffId: string) {
    const staff = await this.prisma.user.update({
      where: { id: staffId },
      data: { isActive: true },
      select: {
        id: true,
        username: true,
        isActive: true,
      },
    });

    return staff;
  }
}
