import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BomService, CreateBomItemDto } from './bom.service';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Mock PrismaService với correct structure */
const mockProducts = new Map<string, any>();
const mockBomItems = new Map<string, any[]>();

const mockPrisma = {
  product: {
    findUnique: vi.fn(({ where: { id } }: any) => Promise.resolve(mockProducts.get(id) || null)),
    findFirst: vi.fn(),
    create: vi.fn(({ data }: any) => {
      mockProducts.set(data.id, data);
      return Promise.resolve(data);
    }),
    update: vi.fn(({ where, data }: any) => {
      const existing = mockProducts.get(where.id);
      const updated = { ...existing, ...data };
      mockProducts.set(where.id, updated);
      return Promise.resolve(updated);
    }),
  },
  bomItem: {
    findMany: vi.fn(({ where: { bomProductId } }: any) => Promise.resolve(mockBomItems.get(bomProductId) || [])),
    findFirst: vi.fn(({ where }: any) => {
      const items = mockBomItems.get(where.bomProductId) || [];
      return Promise.resolve(items.find(i => i.ingredientProductId === where.ingredientProductId) || null);
    }),
    create: vi.fn(({ data }: any) => {
      const key = data.bomProductId;
      const existing = mockBomItems.get(key) || [];
      mockBomItems.set(key, [...existing, data]);
      return Promise.resolve(data);
    }),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

/** Register a leaf product with given cost (in cents). */
async function registerLeaf(
  service: BomService,
  id: string,
  name: string,
  costCents: bigint,
  unit = 'item'
): Promise<void> {
  await service.registerProduct({ id, name, costPrice: costCents, unit, isBom: false });
}

/** Register a BOM product (has ingredients, not raw material). */
async function registerBomProduct(
  service: BomService,
  id: string,
  name: string,
  baseCostCents: bigint = 0n
): Promise<void> {
  await service.registerProduct({
    id,
    name,
    costPrice: baseCostCents,
    unit: 'item',
    isBom: true,
  });
}

/** Create a BOM ingredient link. */
async function addBomItem(service: BomService, dto: CreateBomItemDto): Promise<void> {
  await service.createBomItem(dto);
}

/** Assert that a call throws with a specific message substring. */
async function expectThrow(fn: () => unknown, substring: string): Promise<void> {
  let caught = false;
  let actualMsg = '';
  try {
    const result = fn();
    if (result instanceof Promise) {
      await result;
    }
  } catch (e: any) {
    caught = true;
    actualMsg = e.message || String(e);
  }
  expect(caught).toBe(true);
  expect(actualMsg).toContain(substring);
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe('BomService — Recursive Cost Calculation (with Prisma)', () => {
  let service: BomService;

  beforeEach(() => {
    mockProducts.clear();
    mockBomItems.clear();
    vi.clearAllMocks();
    service = new BomService(mockPrisma as any);
  });

  // ================================================================
  // Test 1: Simple BOM cost = sum of ingredients → PASS
  // ================================================================
  describe('Test 1 — Simple BOM cost = sum of ingredients', () => {
    it('should calculate total cost as sum of all ingredient costs', async () => {
      // Product: "Cháo ếch" (BOM product)
      // Ingredients:
      //   - Rice: 1000g × 500 cents/g = 500,000 cents
      //   - Frog meat: 500g × 2000 cents/g = 1,000,000 cents
      //   - Herbs: 100g × 100 cents/g = 10,000 cents
      // Expected total: 1,510,000 cents (15,100 VND)

      await registerBomProduct(service, 'p_chao', 'Cháo ếch');
      await registerLeaf(service, 'p_rice', 'Gạo', 500n);
      await registerLeaf(service, 'p_frog', 'Thịt ếch', 2000n);
      await registerLeaf(service, 'p_herb', 'Rau thơm', 100n);

      await addBomItem(service, {
        bomProductId: 'p_chao',
        ingredientProductId: 'p_rice',
        quantity: 1000,
      });
      await addBomItem(service, {
        bomProductId: 'p_chao',
        ingredientProductId: 'p_frog',
        quantity: 500,
      });
      await addBomItem(service, {
        bomProductId: 'p_chao',
        ingredientProductId: 'p_herb',
        quantity: 100,
      });

      const result = await service.calculateCost('p_chao');

      expect(result).toBe(1510000n);
    });

    it('should return base cost when BOM has no ingredients', async () => {
      await registerBomProduct(service, 'p_bare', 'Bare BOM', 50000n);

      const result = await service.calculateCost('p_bare');
      expect(result).toBe(50000n);
    });

    it('should handle single ingredient', async () => {
      await registerBomProduct(service, 'p_soup', 'Súp');
      await registerLeaf(service, 'p_flour', 'Bột', 3000n);

      await addBomItem(service, {
        bomProductId: 'p_soup',
        ingredientProductId: 'p_flour',
        quantity: 5,
      });

      const result = await service.calculateCost('p_soup');
      expect(result).toBe(15000n);
    });
  });

  // ================================================================
  // Test 2: Nested BOM (3 levels) cost calculation → PASS
  // ================================================================
  describe('Test 2 — Nested BOM (3 levels) cost calculation', () => {
    it('should correctly calculate 3-level nested BOM cost', async () => {
      // Level 1: "Combo A" → 1x "Bát nước dùng" + 1x "Cháo ếch"
      // Level 2a: "Bát nước dùng" → 100g Muối (50 cents/g) + 50g Tiêu (200 cents/g)
      // Level 2b: "Cháo ếch" → 1000g Gạo (500 cents/g) + 500g Thịt ếch (2000 cents/g)
      // Level 3: "Thịt ếch" is itself a BOM → 200g Lúa (100 cents/g)
      //
      // "Thịt ếch" cost = 200 × 100 = 20,000 cents
      // "Cháo ếch" cost = 1000×500 + 500×20000 = 500,000 + 10,000,000 = 10,500,000
      // "Bát nước dùng" cost = 100×50 + 50×200 = 5,000 + 10,000 = 15,000
      // "Combo A" cost = 15,000 + 10,500,000 = 10,515,000

      await registerBomProduct(service, 'p_combo', 'Combo A');
      await registerBomProduct(service, 'p_nuocdung', 'Bát nước dùng');
      await registerBomProduct(service, 'p_chao', 'Cháo ếch');
      await registerBomProduct(service, 'p_thit', 'Thịt ếch');
      await registerLeaf(service, 'p_muoi', 'Muối', 50n);
      await registerLeaf(service, 'p_tieu', 'Tiêu', 200n);
      await registerLeaf(service, 'p_gao', 'Gạo', 500n);
      await registerLeaf(service, 'p_lua', 'Lúa', 100n);

      // Level 2a: Bát nước dùng
      await addBomItem(service, {
        bomProductId: 'p_nuocdung',
        ingredientProductId: 'p_muoi',
        quantity: 100,
      });
      await addBomItem(service, {
        bomProductId: 'p_nuocdung',
        ingredientProductId: 'p_tieu',
        quantity: 50,
      });

      // Level 2b: Cháo ếch
      await addBomItem(service, {
        bomProductId: 'p_chao',
        ingredientProductId: 'p_gao',
        quantity: 1000,
      });
      await addBomItem(service, {
        bomProductId: 'p_chao',
        ingredientProductId: 'p_thit',
        quantity: 500,
      });

      // Level 3: Thịt ếch (nested BOM)
      await addBomItem(service, {
        bomProductId: 'p_thit',
        ingredientProductId: 'p_lua',
        quantity: 200,
      });

      // Level 1: Combo A
      await addBomItem(service, {
        bomProductId: 'p_combo',
        ingredientProductId: 'p_nuocdung',
        quantity: 1,
      });
      await addBomItem(service, {
        bomProductId: 'p_combo',
        ingredientProductId: 'p_chao',
        quantity: 1,
      });

      // Verify step by step
      const thitCost = await service.calculateCost('p_thit');
      expect(thitCost).toBe(20000n); // 200 * 100

      const chaoCost = await service.calculateCost('p_chao');
      expect(chaoCost).toBe(10500000n); // 500000 + 500*20000

      const nuocdungCost = await service.calculateCost('p_nuocdung');
      expect(nuocdungCost).toBe(15000n); // 5000 + 10000

      const comboCost = await service.calculateCost('p_combo');
      expect(comboCost).toBe(10515000n); // 15000 + 10500000
    });
  });

  // ================================================================
  // Test 3: Circular reference detection blocks save → PASS
  // ================================================================
  describe('Test 3 — Circular reference detection blocks save', () => {
    it('should block self-reference (A → A)', async () => {
      await registerBomProduct(service, 'p_a', 'Product A');

      await expectThrow(
        () => addBomItem(service, {
          bomProductId: 'p_a',
          ingredientProductId: 'p_a',
          quantity: 1,
        }),
        'Circular reference'
      );
    });

    it('should block direct circular reference (A → B → A)', async () => {
      await registerBomProduct(service, 'p_a', 'Product A');
      await registerBomProduct(service, 'p_b', 'Product B');

      await addBomItem(service, {
        bomProductId: 'p_a',
        ingredientProductId: 'p_b',
        quantity: 1,
      });

      // Now A → B exists. Try to create B → A = circular
      await expectThrow(
        () => addBomItem(service, {
          bomProductId: 'p_b',
          ingredientProductId: 'p_a',
          quantity: 1,
        }),
        'Circular reference'
      );
    });

    it('should block indirect circular reference (A → B → C → A)', async () => {
      await registerBomProduct(service, 'p_a', 'Product A');
      await registerBomProduct(service, 'p_b', 'Product B');
      await registerBomProduct(service, 'p_c', 'Product C');

      await addBomItem(service, {
        bomProductId: 'p_a',
        ingredientProductId: 'p_b',
        quantity: 1,
      });
      await addBomItem(service, {
        bomProductId: 'p_b',
        ingredientProductId: 'p_c',
        quantity: 1,
      });

      // Now A → B → C exists. Try to create C → A = circular
      await expectThrow(
        () => addBomItem(service, {
          bomProductId: 'p_c',
          ingredientProductId: 'p_a',
          quantity: 1,
        }),
        'Circular reference'
      );
    });

    it('should allow non-circular addition (A → B, B → C, but NOT C → anything)', async () => {
      await registerBomProduct(service, 'p_a', 'Product A');
      await registerBomProduct(service, 'p_b', 'Product B');
      await registerLeaf(service, 'p_c', 'Raw material C', 1000n);

      await addBomItem(service, {
        bomProductId: 'p_a',
        ingredientProductId: 'p_b',
        quantity: 1,
      });
      await addBomItem(service, {
        bomProductId: 'p_b',
        ingredientProductId: 'p_c',
        quantity: 1,
      });

      // Should NOT throw — not circular
      await expect(
        service.createBomItem({
          bomProductId: 'p_a',
          ingredientProductId: 'p_c',
          quantity: 1,
        })
      ).resolves.not.toThrow();
    });
  });

  // ================================================================
  // Test 4: Cost calculation with unit conversion → PASS
  // ================================================================
  describe('Test 4 — Cost calculation with unit conversion', () => {
    it('should apply unit conversion: 1 nồi cháo = 20 hộp cháo', async () => {
      // Simple model: "Hộp cháo" has ingredients, "Nồi cháo" uses 20 hộp
      // "Hộp cháo" cost = 75,000
      // "Nồi cháo" cost = 20 * 75,000 = 1,500,000

      await registerBomProduct(service, 'p_hop2', 'Hộp cháo đơn');
      await registerBomProduct(service, 'p_noil2', 'Nồi cháo');
      await registerLeaf(service, 'p_rice2', 'Gạo hộp', 500n);
      await registerLeaf(service, 'p_frog2', 'Thịt ếch hộp', 2000n);

      // Hộp cháo: 50g gạo + 25g thịt
      await addBomItem(service, {
        bomProductId: 'p_hop2',
        ingredientProductId: 'p_rice2',
        quantity: 50,
        conversionRate: 1,
      });
      await addBomItem(service, {
        bomProductId: 'p_hop2',
        ingredientProductId: 'p_frog2',
        quantity: 25,
        conversionRate: 1,
      });

      // Nồi cháo: 20 hộp cháo (unit conversion: 1 nồi = 20 hộp)
      await addBomItem(service, {
        bomProductId: 'p_noil2',
        ingredientProductId: 'p_hop2',
        quantity: 20,
        conversionRate: 1,
      });

      // Verify
      const hopCost = await service.calculateCost('p_hop2');
      expect(hopCost).toBe(75000n); // 50*500 + 25*2000

      const noilCost = await service.calculateCost('p_noil2');
      expect(noilCost).toBe(1500000n); // 20 * 75000
    });
  });
});
