import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

// Mock DB — trong thực tế sẽ dùng PrismaService
export const mockProducts: Record<string, Product> = {};
export const mockConversions: Record<string, UnitConversion> = {};
export const barcodeToProductId: Record<string, string> = {};

// Types
export interface Product {
  id: string;
  storeId: string;
  name: string;
  barcode?: string;
  categoryId: string;
  unit: string;
  costPrice: bigint;
  salePrice: bigint;
  minStock: number;
  isBom: boolean;
}

export interface UnitConversion {
  id: string;
  productId: string;
  fromUnit: string;
  toUnit: string;
  ratio: number;
  isActive: boolean;
}

export interface CreateProductDto {
  storeId: string;
  name: string;
  barcode?: string;
  categoryId: string;
  unit?: string;
  costPrice: number | string;
  salePrice: number | string;
  minStock?: number;
  isBom?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  barcode?: string;
  categoryId?: string;
  unit?: string;
  costPrice?: number | string;
  salePrice?: number | string;
  minStock?: number;
  isBom?: boolean;
}

export interface CreateUnitConversionDto {
  productId: string;
  fromUnit: string;
  toUnit: string;
  ratio: number;
}

@Injectable()
export class ProductsService {
  async findAll(storeId: string): Promise<Product[]> {
    return Object.values(mockProducts).filter((p) => p.storeId === storeId);
  }

  async findById(id: string): Promise<Product | null> {
    return mockProducts[id] || null;
  }

  async findByBarcode(storeId: string, barcode: string): Promise<Product | null> {
    // Kiểm tra unique barcode trong store
    const productId = barcodeToProductId[`${storeId}:${barcode}`];
    return productId ? mockProducts[productId] : null;
  }

  async create(storeId: string, dto: CreateProductDto): Promise<Product> {
    const { barcode, name, categoryId, unit = 'item', costPrice, salePrice, minStock = 0, isBom = false } = dto;

    // Check barcode uniqueness ( nếu barcode được cung cấp )
    if (barcode) {
      const existing = await this.findByBarcode(storeId, barcode);
      if (existing) {
        throw new ConflictException(`Barcode '${barcode}' already exists in this store`);
      }
    }

    const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const product: Product = {
      id,
      storeId,
      name,
      barcode: barcode || undefined,
      categoryId,
      unit,
      costPrice: BigInt(costPrice),
      salePrice: BigInt(salePrice),
      minStock,
      isBom,
    };

    mockProducts[id] = product;

    // Track barcode
    if (barcode) {
      barcodeToProductId[`${storeId}:${barcode}`] = id;
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = mockProducts[id];
    if (!product) {
      throw new NotFoundException(`Product '${id}' not found`);
    }

    // Handle barcode update with uniqueness check
    if (dto.barcode !== undefined) {
      if (dto.barcode && dto.barcode !== product.barcode) {
        const existing = Object.values(mockProducts).find(
          (p) => p.barcode === dto.barcode && p.id !== id && p.storeId === product.storeId
        );
        if (existing) {
          throw new ConflictException(`Barcode '${dto.barcode}' already exists in this store`);
        }
        // Remove old barcode tracking
        if (product.barcode) {
          delete barcodeToProductId[`${product.storeId}:${product.barcode}`];
        }
        // Add new barcode tracking
        barcodeToProductId[`${product.storeId}:${dto.barcode}`] = id;
      }
    }

    const updated: Product = {
      ...product,
      ...dto,
      costPrice: dto.costPrice !== undefined ? BigInt(dto.costPrice) : product.costPrice,
      salePrice: dto.salePrice !== undefined ? BigInt(dto.salePrice) : product.salePrice,
    };

    mockProducts[id] = updated;
    return updated;
  }

  async remove(id: string): Promise<void> {
    const product = mockProducts[id];
    if (!product) {
      throw new NotFoundException(`Product '${id}' not found`);
    }

    // Remove barcode tracking
    if (product.barcode) {
      delete barcodeToProductId[`${product.storeId}:${product.barcode}`];
    }

    delete mockProducts[id];
  }

  // Unit Conversion methods
  async createUnitConversion(dto: CreateUnitConversionDto): Promise<UnitConversion> {
    const { productId, fromUnit, toUnit, ratio } = dto;

    // Check if conversion already exists
    const existing = Object.values(mockConversions).find(
      (c) => c.productId === productId && c.fromUnit === fromUnit && c.toUnit === toUnit
    );
    if (existing) {
      throw new ConflictException(`Conversion from '${fromUnit}' to '${toUnit}' for product '${productId}' already exists`);
    }

    // Validate ratio
    if (ratio <= 0) {
      throw new BadRequestException('Ratio must be positive');
    }

    const id = `uc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const conversion: UnitConversion = {
      id,
      productId,
      fromUnit,
      toUnit,
      ratio,
      isActive: true,
    };

    mockConversions[id] = conversion;
    return conversion;
  }

  async findUnitConversions(productId: string): Promise<UnitConversion[]> {
    return Object.values(mockConversions).filter((c) => c.productId === productId && c.isActive);
  }

  async convertUnit(productId: string, fromUnit: string, toUnit: string, quantity: number): Promise<number> {
    const conversions = await this.findUnitConversions(productId);

    // Find direct conversion
    const direct = conversions.find((c) => c.fromUnit === fromUnit && c.toUnit === toUnit);
    if (direct) {
      return quantity * direct.ratio;
    }

    // Find reverse conversion
    const reverse = conversions.find((c) => c.fromUnit === toUnit && c.toUnit === fromUnit);
    if (reverse) {
      return quantity / reverse.ratio;
    }

    throw new BadRequestException(`No conversion found from '${fromUnit}' to '${toUnit}' for product '${productId}'`);
  }

  // For test only: reset mock DB
  resetMockDB(): void {
    Object.keys(mockProducts).forEach((k) => delete mockProducts[k]);
    Object.keys(mockConversions).forEach((k) => delete mockConversions[k]);
    Object.keys(barcodeToProductId).forEach((k) => delete barcodeToProductId[k]);
  }

  // Get all products with unit conversions
  async findAllWithConversions(storeId: string): Promise<(Product & { unitConversions: UnitConversion[] })[]> {
    const products = await this.findAll(storeId);
    return Promise.all(
      products.map(async (p) => ({
        ...p,
        unitConversions: await this.findUnitConversions(p.id),
      }))
    );
  }
}

// Export reset function for test
export const resetMockDB = () => {
  Object.keys(mockProducts).forEach((k) => delete mockProducts[k]);
  Object.keys(mockConversions).forEach((k) => delete mockConversions[k]);
  Object.keys(barcodeToProductId).forEach((k) => delete barcodeToProductId[k]);
};