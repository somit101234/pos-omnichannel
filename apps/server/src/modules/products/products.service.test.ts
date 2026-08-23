import { describe, it, expect, beforeEach } from 'vitest';
import { ProductsService, resetMockDB } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(() => {
    resetMockDB();
    service = new ProductsService();
  });

  // ===== AC1: Barcode uniqueness constraint =====

  describe('AC1 — Barcode uniqueness constraint', () => {
    it('should create product with unique barcode', async () => {
      const product1 = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Product A',
        barcode: '1234567890123',
        categoryId: 'cat_1',
        costPrice: 10000,
        salePrice: 15000,
      });

      expect(product1).toBeDefined();
      expect(product1.barcode).toBe('1234567890123');
    });

    it('should throw ConflictException when creating duplicate barcode in same store', async () => {
      // Create first product with barcode
      await service.create('store_1', {
        storeId: 'store_1',
        name: 'Product A',
        barcode: '1234567890123',
        categoryId: 'cat_1',
        costPrice: 10000,
        salePrice: 15000,
      });

      // Try to create second product with same barcode
      await expect(
        service.create('store_1', {
          storeId: 'store_1',
          name: 'Product B',
          barcode: '1234567890123',
          categoryId: 'cat_1',
          costPrice: 20000,
          salePrice: 25000,
        })
      ).rejects.toThrow("Barcode '1234567890123' already exists in this store");
    });

    it('should allow same barcode in different stores', async () => {
      // Create product in store_1
      await service.create('store_1', {
        storeId: 'store_1',
        name: 'Product A',
        barcode: '1234567890123',
        categoryId: 'cat_1',
        costPrice: 10000,
        salePrice: 15000,
      });

      // Create product with same barcode in store_2
      const product2 = await service.create('store_2', {
        storeId: 'store_2',
        name: 'Product A (store 2)',
        barcode: '1234567890123',
        categoryId: 'cat_1',
        costPrice: 12000,
        salePrice: 18000,
      });

      expect(product2).toBeDefined();
      expect(product2.storeId).toBe('store_2');
    });

    it('should allow product without barcode', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Product No Barcode',
        categoryId: 'cat_1',
        costPrice: 10000,
        salePrice: 15000,
      });

      expect(product).toBeDefined();
      expect(product.barcode).toBeUndefined();
    });
  });

  // ===== AC2: Unit conversion (1 nồi = 20 hộp, ratio = 20) =====

  describe('AC2 — Unit conversion (1 nồi = 20 hộp)', () => {
    it('should create unit conversion: 1 nồi = 20 hộp', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Cháo ếch nồi',
        categoryId: 'cat_1',
        costPrice: 100000,
        salePrice: 150000,
      });

      const conversion = await service.createUnitConversion({
        productId: product.id,
        fromUnit: 'nồi',
        toUnit: 'hộp',
        ratio: 20,
      });

      expect(conversion).toBeDefined();
      expect(conversion.fromUnit).toBe('nồi');
      expect(conversion.toUnit).toBe('hộp');
      expect(conversion.ratio).toBe(20);
    });

    it('should convert 1 nồi to 20 hộp', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Cháo ếch nồi',
        categoryId: 'cat_1',
        costPrice: 100000,
        salePrice: 150000,
      });

      await service.createUnitConversion({
        productId: product.id,
        fromUnit: 'nồi',
        toUnit: 'hộp',
        ratio: 20,
      });

      const result = await service.convertUnit(product.id, 'nồi', 'hộp', 1);
      expect(result).toBe(20);
    });

    it('should convert 3 nồi to 60 hộp', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Cháo ếch nồi',
        categoryId: 'cat_1',
        costPrice: 100000,
        salePrice: 150000,
      });

      await service.createUnitConversion({
        productId: product.id,
        fromUnit: 'nồi',
        toUnit: 'hộp',
        ratio: 20,
      });

      const result = await service.convertUnit(product.id, 'nồi', 'hộp', 3);
      expect(result).toBe(60);
    });

    it('should convert 40 hộp to 2 nồi (reverse)', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Cháo ếch nồi',
        categoryId: 'cat_1',
        costPrice: 100000,
        salePrice: 150000,
      });

      await service.createUnitConversion({
        productId: product.id,
        fromUnit: 'nồi',
        toUnit: 'hộp',
        ratio: 20,
      });

      const result = await service.convertUnit(product.id, 'hộp', 'nồi', 40);
      expect(result).toBe(2);
    });

    it('should find unit conversions for a product', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Sữa đặc',
        categoryId: 'cat_1',
        costPrice: 50000,
        salePrice: 75000,
      });

      await service.createUnitConversion({
        productId: product.id,
        fromUnit: 'nồi',
        toUnit: 'hộp',
        ratio: 20,
      });

      await service.createUnitConversion({
        productId: product.id,
        fromUnit: 'thùng',
        toUnit: 'nồi',
        ratio: 5,
      });

      const conversions = await service.findUnitConversions(product.id);
      expect(conversions.length).toBe(2);
    });
  });

  // ===== AC3: Price stored as BigInt (cents), not float =====

  describe('AC3 — Price stored as BigInt (cents)', () => {
    it('should store costPrice and salePrice as BigInt', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Sữa đặc',
        categoryId: 'cat_1',
        costPrice: 50000,
        salePrice: 75000,
      });

      expect(typeof product.costPrice).toBe('bigint');
      expect(typeof product.salePrice).toBe('bigint');
      expect(product.costPrice).toBe(BigInt(50000));
      expect(product.salePrice).toBe(BigInt(75000));
    });

    it('should handle large price values without precision loss', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Xe hơi mẫu',
        categoryId: 'cat_1',
        costPrice: 1500000000, // 1.5 tỷ VNĐ
        salePrice: 2000000000, // 2 tỷ VNĐ
      });

      expect(product.costPrice).toBe(BigInt(1500000000));
      expect(product.salePrice).toBe(BigInt(2000000000));
    });

    it('should update price with BigInt', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Sữa đặc',
        categoryId: 'cat_1',
        costPrice: 50000,
        salePrice: 75000,
      });

      const updated = await service.update(product.id, {
        salePrice: 80000,
      });

      expect(typeof updated.salePrice).toBe('bigint');
      expect(updated.salePrice).toBe(BigInt(80000));
    });
  });

  // ===== Negative / Boundary cases =====

  describe('Negative and boundary cases', () => {
    it('should throw ConflictException for duplicate conversion (same from/to)', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Sữa đặc',
        categoryId: 'cat_1',
        costPrice: 50000,
        salePrice: 75000,
      });

      await service.createUnitConversion({
        productId: product.id,
        fromUnit: 'nồi',
        toUnit: 'hộp',
        ratio: 20,
      });

      await expect(
        service.createUnitConversion({
          productId: product.id,
          fromUnit: 'nồi',
          toUnit: 'hộp',
          ratio: 20,
        })
      ).rejects.toThrow("Conversion from 'nồi' to 'hộp' for product");
    });

    it('should throw BadRequestException for non-positive ratio', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Sữa đặc',
        categoryId: 'cat_1',
        costPrice: 50000,
        salePrice: 75000,
      });

      await expect(
        service.createUnitConversion({
          productId: product.id,
          fromUnit: 'nồi',
          toUnit: 'hộp',
          ratio: 0,
        })
      ).rejects.toThrow('Ratio must be positive');

      await expect(
        service.createUnitConversion({
          productId: product.id,
          fromUnit: 'nồi',
          toUnit: 'hộp',
          ratio: -1,
        })
      ).rejects.toThrow('Ratio must be positive');
    });

    it('should throw NotFoundException for non-existent product on update', async () => {
      await expect(
        service.update('nonexistent', { name: 'New Name' })
      ).rejects.toThrow("Product 'nonexistent' not found");
    });

    it('should throw NotFoundException for non-existent product on remove', async () => {
      await expect(service.remove('nonexistent')).rejects.toThrow("Product 'nonexistent' not found");
    });

    it('should throw BadRequestException for no conversion found', async () => {
      const product = await service.create('store_1', {
        storeId: 'store_1',
        name: 'Sữa đặc',
        categoryId: 'cat_1',
        costPrice: 50000,
        salePrice: 75000,
      });

      await expect(
        service.convertUnit(product.id, 'nồi', 'thùng', 1)
      ).rejects.toThrow("No conversion found from 'nồi' to 'thùng' for product");
    });
  });
});
