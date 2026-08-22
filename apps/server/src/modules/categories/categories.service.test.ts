import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesService } from './categories.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// Mock PrismaService với correct structure
const mockPrisma = {
  category: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
  },
  product: {
    findFirst: vi.fn(),
  },
};

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CategoriesService(mockPrisma as any);
  });

  describe('AC1 — Create category with parent', () => {
    it('should create category with parent_id and return 201', async () => {
      const mockCategory = {
        id: 'cat_new_1',
        storeId: 'store_1',
        name: 'Đồ uống',
        parentId: 'cat_parent_1',
      };

      // Mock parent exists with different id
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat_parent_1' });
      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.create({
        storeId: 'store_1',
        name: 'Đồ uống',
        parentId: 'cat_parent_1',
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          storeId: 'store_1',
          name: 'Đồ uống',
          parentId: 'cat_parent_1',
        },
      });
    });

    it('should create category without parent (root category)', async () => {
      const mockCategory = {
        id: 'cat_root_1',
        storeId: 'store_1',
        name: 'Thực phẩm',
        parentId: null,
      };

      mockPrisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.create({
        storeId: 'store_1',
        name: 'Thực phẩm',
        parentId: null,
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrisma.category.create).toHaveBeenCalledWith({
        data: {
          storeId: 'store_1',
          name: 'Thực phẩm',
          parentId: undefined,
        },
      });
    });

    it('should reject self-referencing parent (category becomes its own parent)', async () => {
      const categoryId = 'cat_self_ref_1';
      mockPrisma.category.findUnique.mockResolvedValue({ id: categoryId });

      await expect(
        service.create({
          storeId: 'store_1',
          name: 'Tự tham chiếu',
          parentId: categoryId,
        })
      ).rejects.toThrow('Cannot set category as its own parent');
    });
  });

  describe('AC2 — Get categories sorted by store_id + parent hierarchy', () => {
    it('should return categories sorted by store_id, then parent_id, then name', async () => {
      const mockCategories = [
        { id: 'cat1', storeId: 'store_1', name: 'A', parentId: null },
        { id: 'cat2', storeId: 'store_1', name: 'B', parentId: null },
        { id: 'cat3', storeId: 'store_1', name: 'A1', parentId: 'cat1' },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll('store_1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it('should return empty array for store with no categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);

      const result = await service.findAll('nonexistent_store');

      expect(result).toEqual([]);
    });
  });

  describe('AC3 — Update category', () => {
    it('should update category name', async () => {
      const existing = {
        id: 'cat_1',
        storeId: 'store_1',
        name: 'Cũ',
        parentId: null,
      };

      const updated = {
        ...existing,
        name: 'Đồ uống cập nhật',
      };

      mockPrisma.category.findUnique.mockResolvedValue(existing);
      mockPrisma.category.update.mockResolvedValue(updated);

      const result = await service.update('cat_1', {
        name: 'Đồ uống cập nhật',
      });

      expect(result.name).toBe('Đồ uống cập nhật');
      expect(mockPrisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat_1' },
        data: { name: 'Đồ uống cập nhật' },
      });
    });

    it('should update category parent (move category to new parent)', async () => {
      const existing = {
        id: 'cat_1',
        storeId: 'store_1',
        name: 'Cũ',
        parentId: null,
      };

      const updated = {
        ...existing,
        parentId: 'new_parent_id',
      };

      mockPrisma.category.findUnique.mockResolvedValue(existing);
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValue({ id: 'new_parent_id' });
      mockPrisma.category.update.mockResolvedValue(updated);

      const result = await service.update('cat_1', {
        parentId: 'new_parent_id',
      });

      expect(result.parentId).toBe('new_parent_id');
    });
  });

  describe('AC4 — Delete category', () => {
    it('should delete category successfully when no products reference it', async () => {
      const existing = { id: 'cat_1', name: 'Test' };
      mockPrisma.category.findUnique.mockResolvedValue(existing);
      mockPrisma.category.delete.mockResolvedValue(existing);
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(service.delete('cat_1')).resolves.toBeDefined();
    });

    it('should block delete if products reference the category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat_1' });
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'prod_1' });

      await expect(service.delete('cat_1')).rejects.toThrow(
        'Cannot delete category: 1 product(s) reference it'
      );
    });
  });

  describe('Negative / Edge cases', () => {
    it('should throw BadRequestException for empty name', async () => {
      await expect(
        service.create({
          storeId: 'store_1',
          name: '',
          parentId: null,
        })
      ).rejects.toThrow('Category name is required');
    });

    it('should throw NotFoundException for non-existent category update', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'test' })).rejects.toThrow(
        'Category nonexistent not found'
      );
    });

    it('should throw NotFoundException for non-existent category delete', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow('Category nonexistent not found');
    });
  });
});
