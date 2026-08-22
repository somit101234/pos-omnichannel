import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types/role';
import ProductGrid, { Product } from '../../components/ProductGrid';
import CartPanel, { CartItem } from '../../components/CartPanel';
import PaymentDialog from '../../components/PaymentDialog';

// Mock data sản phẩm
const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Cháo ếch', barcode: '1234567890001', categoryId: 'cat1', categoryName: 'Cháo', unit: 'chén', costPrice: 8000, salePrice: 15000, minStock: 5, quantity: 20 },
  { id: 'p2', name: 'Cơm sườn', barcode: '1234567890002', categoryId: 'cat1', categoryName: 'Cơm', unit: 'suất', costPrice: 10000, salePrice: 20000, minStock: 5, quantity: 15 },
  { id: 'p3', name: 'Bánh mì', barcode: '1234567890003', categoryId: 'cat2', categoryName: 'Đồ ăn vặt', unit: 'cái', costPrice: 3000, salePrice: 5000, minStock: 10, quantity: 30 },
  { id: 'p4', name: 'Nước ép', barcode: '1234567890004', categoryId: 'cat3', categoryName: 'Đồ uống', unit: 'ly', costPrice: 5000, salePrice: 10000, minStock: 10, quantity: 25 },
  { id: 'p5', name: 'Phở bò', barcode: '1234567890005', categoryId: 'cat1', categoryName: 'Mì/phở', unit: 'bát', costPrice: 12000, salePrice: 25000, minStock: 5, quantity: 10 },
];

const POSPage: React.FC = () => {
  const navigate = useNavigate();
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    if (product.quantity === 0) {
      alert('Sản phẩm đã hết hàng');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          unit: product.unit,
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          quantity: 1,
        },
      ];
    });
  };

  // Update cart item quantity
  const handleQtyChange = (productId: string, qty: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  // Remove item from cart
  const handleRemove = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Checkout - open payment dialog
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    setIsPaymentOpen(true);
  };

  // Process payment
  const handlePayment = (method: 'cash' | 'card', cashReceived?: number) => {
    setIsPaymentOpen(false);
    
    // Simulate receipt print
    console.log('Receipt print triggered:', {
      method,
      cashReceived,
      total: cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0),
    });
    
    // Clear cart after successful payment
    setCart([]);
    
    alert(`Thanh toán thành công bằng ${method === 'cash' ? 'tiền mặt' : 'thẻ'}!`);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>POS — Bán hàng</h1>
        <div style={styles.roleBadge}>
          <span style={styles.roleLabel}>Vai trò:</span>
          <span style={styles.roleText}>{UserRole.CASHIER}</span>
        </div>
      </header>

      <div style={styles.main}>
        {/* Product grid */}
        <div style={styles.gridSection}>
          <ProductGrid
            products={MOCK_PRODUCTS}
            selectedCategoryId={selectedCategoryId}
            searchQuery={searchQuery}
            onSelectProduct={handleAddToCart}
            onCategorySelect={setSelectedCategoryId}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Cart panel */}
        <div style={styles.cartSection}>
          <CartPanel
            items={cart}
            onQtyChange={handleQtyChange}
            onRemove={handleRemove}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        isOpen={isPaymentOpen}
        cartItems={cart}
        onClose={() => setIsPaymentOpen(false)}
        onPayment={handlePayment}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    color: '#fff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
  },
  roleBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  roleLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
  },
  roleText: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  main: {
    flex: 1,
    display: 'flex',
    gap: '24px',
    padding: '24px',
  },
  gridSection: {
    flex: 2,
    minHeight: 0, // Prevent flex item overflow
  },
  cartSection: {
    flex: 1,
    minHeight: 0, // Prevent flex item overflow
  },
};

export default POSPage;
