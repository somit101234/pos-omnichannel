import { describe, it, expect, beforeEach } from 'vitest';
import { PosService } from './pos.service';

// ── Mock types (matching production types) ───────────────────────────────────

interface Product {
  id: string;
  name: string;
  barcode: string;
  costPrice: bigint;
  salePrice: bigint;
  minStock: number;
  isBom: boolean;
  unit: string;
}

interface Stock {
  productId: string;
  warehouseId: string;
  quantity: number;
}

interface BomItem {
  bomProductId: string;
  ingredientProductId: string;
  quantity: number;
  conversionRate: number;
}

// ── Mock data ────────────────────────────────────────────────────────────────

const WAREHOUSE_ID = 'wh_001';
const CASHIER_ID = 'user_cashier_001';
const STORE_ID = 'store_001';

// Mock products
const PRODUCT_RICE_BOWL: Product = {
  id: 'prod_rice_bowl',
  name: 'Cơm chay',
  barcode: '8856500123456',
  costPrice: 10000n,
  salePrice: 15000n,
  minStock: 10,
  isBom: false,
  unit: 'hộp',
};

const PRODUCT_CHICKEN: Product = {
  id: 'prod_chicken',
  name: 'Gà rán',
  barcode: '8856500123457',
  costPrice: 25000n,
  salePrice: 35000n,
  minStock: 5,
  isBom: false,
  unit: 'cái',
};

const PRODUCT_BOM_MEATBALL: Product = {
  id: 'prod_meatball_bom',
  name: 'Cơm мясball',
  barcode: '8856500123458',
  costPrice: 0n, // will be calculated from BOM
  salePrice: 25000n,
  minStock: 5,
  isBom: true,
  unit: 'bát',
};

const INGREDIENT_MEAT: Product = {
  id: 'prod_meat',
  name: 'Thịt heo',
  barcode: '8856500123459',
  costPrice: 80000n,
  salePrice: 120000n,
  minStock: 2,
  isBom: false,
  unit: 'kg',
};

// ── Mock stores ──────────────────────────────────────────────────────────────

const stockStore = new Map<string, Stock>();
const productStore = new Map<string, Product>();
const bomStore: BomItem[] = [];

function getStockKey(productId: string, warehouseId: string) {
  return `${productId}:${warehouseId}`;
}

function getStock(productId: string, warehouseId: string): Stock | undefined {
  return stockStore.get(getStockKey(productId, warehouseId));
}

function setStock(productId: string, warehouseId: string, quantity: number) {
  stockStore.set(getStockKey(productId, warehouseId), {
    productId,
    warehouseId,
    quantity,
  });
}

function getProduct(id: string): Product | undefined {
  return productStore.get(id);
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PosService', () => {
  let posService: PosService;

  beforeEach(() => {
    // Reset mock stores
    stockStore.clear();
    productStore.clear();
    bomStore.length = 0;

    // Register mock data
    productStore.set(PRODUCT_RICE_BOWL.id, PRODUCT_RICE_BOWL);
    productStore.set(PRODUCT_CHICKEN.id, PRODUCT_CHICKEN);
    productStore.set(PRODUCT_BOM_MEATBALL.id, PRODUCT_BOM_MEATBALL);
    productStore.set(INGREDIENT_MEAT.id, INGREDIENT_MEAT);

    // Set initial stock
    setStock(PRODUCT_RICE_BOWL.id, WAREHOUSE_ID, 10);
    setStock(PRODUCT_CHICKEN.id, WAREHOUSE_ID, 5);
    setStock(PRODUCT_BOM_MEATBALL.id, WAREHOUSE_ID, 3);
    setStock(INGREDIENT_MEAT.id, WAREHOUSE_ID, 2);

    // Register BOM for meatball product
    bomStore.push({
      bomProductId: PRODUCT_BOM_MEATBALL.id,
      ingredientProductId: INGREDIENT_MEAT.id,
      quantity: 0.2, // 200g meat per bowl
      conversionRate: 1,
    });

    // Create service with mocks
    posService = new PosService({
      stockGetter: getStock,
      productGetter: getProduct,
      bomGetter: () => bomStore,
    });
  });

  describe('Add to cart', () => {
    it('should add product to cart and return total', () => {
      const result = posService.addToCart({
        productId: PRODUCT_RICE_BOWL.id,
        quantity: 2,
        warehouseId: WAREHOUSE_ID,
      });

      expect(result.total).toBe(30000n); // 2 × 15000
      const cart = posService.getCart();
      expect(cart).toHaveLength(1);
      expect(cart[0].productId).toBe(PRODUCT_RICE_BOWL.id);
      expect(cart[0].quantity).toBe(2);
    });

    it('should update quantity if product already in cart', () => {
      posService.addToCart({
        productId: PRODUCT_RICE_BOWL.id,
        quantity: 1,
        warehouseId: WAREHOUSE_ID,
      });

      const result = posService.updateCart(PRODUCT_RICE_BOWL.id, 3);

      expect(result.total).toBe(45000n); // 3 × 15000
      const cart = posService.getCart();
      expect(cart[0].quantity).toBe(3);
    });

    it('should block add to cart when stock = 0', () => {
      // Set stock to 0
      setStock(PRODUCT_RICE_BOWL.id, WAREHOUSE_ID, 0);

      expect(() =>
        posService.addToCart({
          productId: PRODUCT_RICE_BOWL.id,
          quantity: 1,
          warehouseId: WAREHOUSE_ID,
        }),
      ).toThrow('Out of stock');
    });
  });

  describe('Checkout', () => {
    it('should create transaction with cash payment', () => {
      const result = posService.checkout({
        productId: PRODUCT_RICE_BOWL.id,
        quantity: 2,
        warehouseId: WAREHOUSE_ID,
        paymentMethod: 'CASH',
      });

      expect(result.type).toBe('SALE');
      expect(result.paymentMethod).toBe('CASH');
      expect(result.total).toBe(30000n); // 2 × 15000
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productId).toBe(PRODUCT_RICE_BOWL.id);
    });

    it('should create transaction with card payment', () => {
      const result = posService.checkout({
        productId: PRODUCT_RICE_BOWL.id,
        quantity: 1,
        warehouseId: WAREHOUSE_ID,
        paymentMethod: 'CARD',
      });

      expect(result.paymentMethod).toBe('CARD');
    });

    it('should decrease stock after checkout', () => {
      const initialStock = getStock(PRODUCT_RICE_BOWL.id, WAREHOUSE_ID);
      expect(initialStock?.quantity).toBe(10);

      posService.checkout({
        productId: PRODUCT_RICE_BOWL.id,
        quantity: 2,
        warehouseId: WAREHOUSE_ID,
        paymentMethod: 'CASH',
      });

      const finalStock = getStock(PRODUCT_RICE_BOWL.id, WAREHOUSE_ID);
      expect(finalStock?.quantity).toBe(8);
    });

    it('should deduct BOM ingredient stock recursively', () => {
      // Initial ingredient stock
      const initialIngredientStock = getStock(INGREDIENT_MEAT.id, WAREHOUSE_ID);
      expect(initialIngredientStock?.quantity).toBe(2); // 2 kg

      // Checkout 1 BOM product (0.2 kg meat per bowl)
      posService.checkout({
        productId: PRODUCT_BOM_MEATBALL.id,
        quantity: 1,
        warehouseId: WAREHOUSE_ID,
        paymentMethod: 'CASH',
      });

      // Verify ingredient stock decreased by 0.2 kg
      const finalIngredientStock = getStock(INGREDIENT_MEAT.id, WAREHOUSE_ID);
      expect(finalIngredientStock?.quantity).toBe(1.8); // 2 - 0.2
    });

    it('should block checkout when stock insufficient', () => {
      // Try to sell more than available
      expect(() =>
        posService.checkout({
          productId: PRODUCT_RICE_BOWL.id,
          quantity: 100,
          warehouseId: WAREHOUSE_ID,
          paymentMethod: 'CASH',
        }),
      ).toThrow('Insufficient stock');
    });
  });
});
