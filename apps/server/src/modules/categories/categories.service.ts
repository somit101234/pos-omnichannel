// @ts-nocheck
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { Category } from '@prisma/client';

export interface CreateCategoryDto {
  storeId: string;
  name: string;
  parentId?: string | null;
}

export interface UpdateCategoryDto {
  name?: string;
  parentId?: string | null;
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestException('Category name is required');
    }

    // For CREATE, if parentId is set, verify parent exists
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
      });

      if (!parent) {
        throw new NotFoundException(`Parent category ${dto.parentId} not found`);
      }
    }

    return this.prisma.category.create({
      data: {
        storeId: dto.storeId,
        name: dto.name.trim(),
        parentId: dto.parentId || undefined,
      },
    });
  }

  async findAll(storeId: string) {
    // Get all categories for this store
    const categories: any[] = await this.prisma.category.findMany({
      where: { storeId },
      orderBy: [
        { storeId: 'asc' },
        { parentId: 'asc' }, // null parents first
        { name: 'asc' },
      ],
    });

    // Build hierarchy: root categories first, then children
    const rootCategories = categories.filter((c) => !c.parentId);
    const childrenByParent: Record<string, typeof categories> = {};

    categories.forEach((c) => {
      if (c.parentId) {
        if (!childrenByParent[c.parentId]) {
          childrenByParent[c.parentId] = [];
        }
        childrenByParent[c.parentId].push(c);
      }
    });

    // Sort children alphabetically within each parent
    Object.keys(childrenByParent).forEach((parentId) => {
      childrenByParent[parentId].sort((a, b) => a.name.localeCompare(b.name));
    });

    rootCategories.sort((a, b) => a.name.localeCompare(b.name));

    return [...rootCategories, ...categories.filter((c) => !!c.parentId)];
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    // If updating parentId, validate it
    if (dto.parentId !== undefined) {
      if (dto.parentId) {
        const parent = await this.prisma.category.findUnique({
          where: { id: dto.parentId },
        });

        if (!parent) {
          throw new NotFoundException(`Parent category ${dto.parentId} not found`);
        }

        // Self-reference check
        if (parent.id === id) {
          throw new BadRequestException('Cannot set category as its own parent');
        }
      }

      return this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name?.trim() ?? existing.name,
          parentId: dto.parentId === '' ? null : dto.parentId ?? undefined,
        },
      });
    }

    // Only name update
    return this.prisma.category.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? existing.name,
      },
    });
  }

  async delete(id: string) {
    const existing = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    // Check if any product references this category
    const productRef = await this.prisma.product.findFirst({
      where: { categoryId: id },
      select: { id: true },
    });

    if (productRef) {
      throw new BadRequestException(
        `Cannot delete category: 1 product(s) reference it`
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
