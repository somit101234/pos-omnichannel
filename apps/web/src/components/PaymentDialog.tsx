import React from 'react';

interface CartItem {
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

interface PaymentDialogProps {
  isOpen: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onPayment: (method: 'cash' | 'card', cashReceived?: number) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  cartItems,
  onClose,
  onPayment,
}) => {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0
  );
  const total = subtotal;

  const [paymentMethod, setPaymentMethod] = React.useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = React.useState<string>('');

  const change = paymentMethod === 'cash' && cashReceived
    ? parseInt(cashReceived, 10) - total
    : 0;

  if (!isOpen) return null;

  const handleCashPayment = () => {
    const received = parseInt(cashReceived, 10);
    if (isNaN(received) || received < total) {
      alert('Số tiền nhận không đủ');
      return;
    }
    onPayment('cash', received);
  };

  const handleCardPayment = () => {
    onPayment('card');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.dialog}>
        <h3 style={styles.title}>Thanh toán</h3>
        <div style={styles.total}>
          Tổng tiền: {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(total)}
        </div>

        <div style={styles.methodSelector}>
          <button
            style={{
              ...styles.methodButton,
              ...(paymentMethod === 'cash' ? styles.methodButtonActive : {}),
            }}
            onClick={() => setPaymentMethod('cash')}
          >
            Tiền mặt
          </button>
          <button
            style={{
              ...styles.methodButton,
              ...(paymentMethod === 'card' ? styles.methodButtonActive : {}),
            }}
            onClick={() => setPaymentMethod('card')}
          >
            Thẻ
          </button>
        </div>

        {paymentMethod === 'cash' && (
          <div style={styles.cashInput}>
            <label style={styles.label}>Số tiền khách đưa:</label>
            <input
              type="number"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              style={styles.input}
              placeholder="Nhập số tiền"
            />
            {cashReceived && (
              <div style={styles.change}>
                {'Tiền thừa: ' + new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                }).format(change)}
              </div>
            )}
          </div>
        )}

        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            Hủy
          </button>
          {paymentMethod === 'cash' ? (
            <button style={styles.payButton} onClick={handleCashPayment}>
              Thanh toán tiền mặt
            </button>
          ) : (
            <button style={styles.payButton} onClick={handleCardPayment}>
              Thanh toán thẻ
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '20px',
  },
  total: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1976d2',
    marginBottom: '24px',
  },
  methodSelector: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  methodButton: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  methodButtonActive: {
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
  },
  cashInput: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  change: {
    marginTop: '8px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#4caf50',
  },
  footer: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  payButton: {
    padding: '10px 20px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default PaymentDialog;
