import React from 'react';

export interface CartItem {
  productId: string;
  name: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  quantity: number;
}

interface CartPanelProps {
  items: CartItem[];
  onQtyChange: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}

const CartPanel: React.FC<CartPanelProps> = ({
  items,
  onQtyChange,
  onRemove,
  onCheckout,
}) => {
  const subtotal = items.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0
  );

  const total = subtotal; // chưa có discount/tax

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Giỏ hàng ({items.length})</h3>
      <div style={styles.items}>
        {items.map((item) => (
          <div key={item.productId} style={styles.item}>
            <div style={styles.itemInfo}>
              <div style={styles.itemName}>{item.name}</div>
              <div style={styles.itemBarcode}>{item.barcode}</div>
              <div style={styles.itemPrice}>
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(item.salePrice)}
              </div>
            </div>
            <div style={styles.itemActions}>
              <div style={styles.qtyControl}>
                <button
                  style={styles.qtyButton}
                  onClick={() => onQtyChange(item.productId, Math.max(1, item.quantity - 1))}
                >
                  -
                </button>
                <span style={styles.qty}>{item.quantity}</span>
                <button
                  style={styles.qtyButton}
                  onClick={() => onQtyChange(item.productId, item.quantity + 1)}
                >
                  +
                </button>
              </div>
              <button style={styles.removeButton} onClick={() => onRemove(item.productId)}>
                Xóa
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div style={styles.emptyState}>
            Giỏ hàng trống
          </div>
        )}
      </div>
      <div style={styles.footer}>
        <div style={styles.row}>
          <span style={styles.label}>Tạm tính:</span>
          <span style={styles.value}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(subtotal)}
          </span>
        </div>
        <div style={styles.row}>
          <span style={styles.label}>Tổng:</span>
          <span style={styles.valueTotal}>
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(total)}
          </span>
        </div>
        <button
          style={styles.checkoutButton}
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Thanh toán
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: 0,
    padding: '16px',
    fontSize: '16px',
    borderBottom: '1px solid #e0e0e0',
  },
  items: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#333',
  },
  itemBarcode: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  itemPrice: {
    fontWeight: '600',
    color: '#1976d2',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  qtyButton: {
    width: '28px',
    height: '28px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
  },
  qty: {
    minWidth: '32px',
    textAlign: 'center',
    fontSize: '14px',
  },
  removeButton: {
    padding: '6px 12px',
    border: '1px solid #f44336',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '12px',
  },
  emptyState: {
    padding: '40px',
    textAlign: 'center',
    color: '#666',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '14px',
    color: '#666',
  },
  value: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  valueTotal: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1976d2',
  },
  checkoutButton: {
    padding: '12px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default CartPanel;
