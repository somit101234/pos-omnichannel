/**
 * Seed script — creates minimal data for development.
 * Password hashes are placeholders; AuthModule (T002) will implement bcrypt.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Owner user
  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      username: 'owner',
      passwordHash: '$2b$10$SEED_PLACEHOLDER_HASH',
      email: 'owner@pos-local.dev',
      role: 'OWNER',
      storeId: 'store-demo',
    },
  });

  // 2. Two stores
  const store1 = await prisma.store.upsert({
    where: { id: 'store-demo' },
    update: {},
    create: {
      id: 'store-demo',
      name: 'POS Demo Store',
      address: '123 Le Loi, District 1, HCMC',
      phone: '0901234567',
      taxCode: '0123456789',
      ownerId: owner.id,
      settings: { currency: 'VND', taxRate: 0.1 },
    },
  });

  await prisma.store.create({
    data: {
      id: 'store-2',
      name: 'POS Branch 2',
      address: '456 Nguyen Hue, District 1, HCMC',
      phone: '0909876543',
      taxCode: '9876543210',
      ownerId: owner.id,
      settings: { currency: 'VND', taxRate: 0.1 },
    },
  });

  // 3. Two categories
  const electronics = await prisma.category.create({
    data: { id: 'cat-elec', storeId: store1.id, name: 'Điện tử' },
  });

  const food = await prisma.category.create({
    data: { id: 'cat-food', storeId: store1.id, name: 'Thực phẩm' },
  });

  // 4. Five products
  await prisma.product.createMany({
    data: [
      { id: 'prod-1', storeId: store1.id, name: 'Cà phê sữa đá', barcode: '8936092100011', categoryId: electronics.id, unit: 'cup', costPrice: 15000, salePrice: 25000, minStock: 10 },
      { id: 'prod-2', storeId: store1.id, name: 'Phở bò', barcode: '8936092100028', categoryId: food.id, unit: 'bowl', costPrice: 30000, salePrice: 55000, minStock: 5 },
      { id: 'prod-3', storeId: store1.id, name: 'Nước suối', barcode: '8936092100035', categoryId: food.id, unit: 'bottle', costPrice: 5000, salePrice: 10000, minStock: 50 },
      { id: 'prod-4', storeId: store1.id, name: 'Bánh mì', barcode: '8936092100042', categoryId: food.id, unit: 'piece', costPrice: 10000, salePrice: 20000, minStock: 20 },
      { id: 'prod-5', storeId: store1.id, name: 'Trà đào', barcode: '8936092100059', categoryId: electronics.id, unit: 'cup', costPrice: 12000, salePrice: 22000, minStock: 15 },
    ],
  });

  // 5. One supplier
  await prisma.supplier.create({
    data: {
      id: 'supplier-1',
      name: 'VN Coffee Wholesale',
      phone: '0912345678',
      address: '78 Hoàng Hoa Thám, Tân Bình, HCMC',
    },
  });

  // 6. Warehouse
  await prisma.warehouse.create({
    data: {
      id: 'wh-demo',
      storeId: store1.id,
      name: 'Kho chính',
      address: '123 Le Loi, Warehouse B',
    },
  });

  // 7. Cashier
  await prisma.user.create({
    data: {
      id: 'cashier-1',
      username: 'cashier-demo',
      passwordHash: '$2b$10$SEED_PLACEHOLDER_HASH',
      role: 'CASHIER',
      storeId: store1.id,
    },
  });

  console.log('✅ Seeded: 1 owner, 1 cashier, 2 stores, 5 products, 2 categories, 1 supplier');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.stderr.write('Error: ' + e.message + '\n');
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
