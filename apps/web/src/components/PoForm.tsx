import React from 'react';

export interface PoItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface PoFormValues {
  supplierId: string;
  items: PoItem[];
}

export interface PoFormProps {
  suppliers: { id: string; name: string; phone: string; address: string }[];
  products: { id: string; name: string; barcode: string; unit: string; costPrice: number; salePrice: number }[];
  onSubmit: (values: PoFormValues) => void;
  onCancel: () => void;
}

const PoForm: React.FC<PoFormProps> = ({ suppliers, products, onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState<PoFormValues>({
    supplierId: suppliers[0]?.id || '',
    items: [],
  });

  const [selectedProduct, setSelectedProduct] = React.useState<string>('');
  const [newItemQty, setNewItemQty] = React.useState<number>(1);

  const handleAddItem = () => {
    if (!selectedProduct || newItemQty <= 0) {
      alert('Vui lòng chọn sản phẩm và số lượng hợp lệ');
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const newItem: PoItem = {
      productId: product.id,
      productName: product.name,
      quantity: newItemQty,
      unitPrice: product.costPrice,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setSelectedProduct('');
    setNewItemQty(1);
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateItemQty = (index: number, qty: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, quantity: qty } : item)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }
    onSubmit(formData);
  };

  const calculateTotal = (): number => {
    return formData.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Thông tin đơn hàng</h3>
        <div style={styles.row}>
          <div style={styles.field}>
            <label style={styles.label}>Nhà cung cấp *</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData((prev) => ({ ...prev, supplierId: e.target.value }))}
              style={styles.select}
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.phone}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Danh sách sản phẩm</h3>
        <div style={styles.addItemRow}>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            style={styles.select}
          >
            <option value="">Chọn sản phẩm...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.barcode}) - {p.unit}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={newItemQty}
            onChange={(e) => setNewItemQty(Number(e.target.value))}
            style={{ ...styles.input, width: '100px' }}
            placeholder="SL"
          />
          <button
            type="button"
            onClick={handleAddItem}
            style={{ ...styles.submitButton, padding: '10px 16px' }}
          >
            + Thêm
          </button>
        </div>

        {formData.items.length > 0 && (
          <div style={styles.itemsList}>
            {formData.items.map((item, index) => (
              <div key={index} style={styles.itemRow}>
                <div style={styles.itemInfo}>
                  <span style={styles.itemName}>{item.productName}</span>
                  <span style={styles.itemUnitPrice}>{item.unitPrice.toLocaleString()} VNĐ</span>
                </div>
                <div style={styles.itemControls}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateItemQty(index, Number(e.target.value))}
                    style={{ ...styles.input, width: '60px', textAlign: 'center' }}
                  />
                  <span style={styles.itemSubtotal}>
                    = {(item.unitPrice * item.quantity).toLocaleString()} VNĐ
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    style={styles.removeItemButton}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.totalSection}>
        <h4 style={styles.totalLabel}>Tổng cộng:</h4>
        <span style={styles.totalAmount}>{calculateTotal().toLocaleString()} VNĐ</span>
      </div>

      <div style={styles.actions}>
        <button type="button" onClick={onCancel} style={styles.cancelButton}>
          Hủy
        </button>
        <button type="submit" style={styles.submitButton}>
          Tạo đơn nhập hàng
        </button>
      </div>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '24px',
    paddingBottom: '24px',
    borderBottom: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  field: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#333',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  addItemRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  submitButton: {
    padding: '10px 16px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#fafafa',
    borderRadius: '4px',
  },
  itemInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontWeight: '500',
    color: '#333',
  },
  itemUnitPrice: {
    fontSize: '12px',
    color: '#666',
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  itemSubtotal: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#1976d2',
  },
  removeItemButton: {
    width: '28px',
    height: '28px',
    border: '1px solid #f44336',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '16px',
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    marginBottom: '24px',
  },
  totalLabel: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1976d2',
  },
  actions: {
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
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default PoForm;
