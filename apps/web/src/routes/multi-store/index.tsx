import React from 'react';

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  taxCode: string;
  isActive: boolean;
  warehouseId?: string;
}

export interface Warehouse {
  id: string;
  storeId: string;
  name: string;
  address: string;
}

export interface Transfer {
  id: string;
  fromStoreId: string;
  toStoreId: string;
  items: string;
  quantity: number;
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED';
  createdAt: string;
}

const MultiStorePage: React.FC = () => {
  // Mock data
  const [stores, setStores] = React.useState<Store[]>([
    {
      id: 's1',
      name: 'Chi nhánh Quận 1',
      address: '123 Đường ABC, Quận 1',
      phone: '028 1234 5678',
      taxCode: '0123456789',
      isActive: true,
      warehouseId: 'w1',
    },
    {
      id: 's2',
      name: 'Chi nhánh Quận 2',
      address: '456 Đường XYZ, Quận 2',
      phone: '028 9876 5432',
      taxCode: '0987654321',
      isActive: true,
      warehouseId: 'w2',
    },
    {
      id: 's3',
      name: 'Chi nhánh Quận 3',
      address: '789 Đường DEF, Quận 3',
      phone: '028 1111 2222',
      taxCode: '0555666777',
      isActive: false,
      warehouseId: 'w3',
    },
  ]);

  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([
    { id: 'w1', storeId: 's1', name: 'Kho Quận 1', address: '123 Đường ABC, Quận 1' },
    { id: 'w2', storeId: 's2', name: 'Kho Quận 2', address: '456 Đường XYZ, Quận 2' },
    { id: 'w3', storeId: 's3', name: 'Kho Quận 3', address: '789 Đường DEF, Quận 3' },
  ]);

  const [transfers, setTransfers] = React.useState<Transfer[]>([
    { id: 't1', fromStoreId: 's1', toStoreId: 's2', items: 'Hộp cháo', quantity: 50, status: 'IN_TRANSIT', createdAt: '2026-08-22 10:00' },
    { id: 't2', fromStoreId: 's2', toStoreId: 's3', items: 'Nồi cháo', quantity: 5, status: 'COMPLETED', createdAt: '2026-08-21 15:30' },
  ]);

  const [showForm, setShowForm] = React.useState(false);
  const [editingStore, setEditingStore] = React.useState<Store | undefined>(undefined);

  // Form state
  const [storeForm, setStoreForm] = React.useState({
    name: '',
    address: '',
    phone: '',
    taxCode: '',
  });

  const handleCreate = () => {
    setEditingStore(undefined);
    setStoreForm({ name: '', address: '', phone: '', taxCode: '' });
    setShowForm(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setStoreForm({
      name: store.name,
      address: store.address,
      phone: store.phone,
      taxCode: store.taxCode,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Xác nhận xóa chi nhánh?')) {
      setStores((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStore) {
      // Update
      setStores((prev) =>
        prev.map((s) =>
          s.id === editingStore.id
            ? { ...s, ...storeForm }
            : s
        )
      );
    } else {
      // Create
      const newStore: Store = {
        id: `s${Date.now()}`,
        name: storeForm.name,
        address: storeForm.address,
        phone: storeForm.phone,
        taxCode: storeForm.taxCode,
        isActive: true,
        warehouseId: `w${Date.now()}`,
      };
      setStores((prev) => [...prev, newStore]);
      setWarehouses((prev) => [
        ...prev,
        { id: newStore.warehouseId!, storeId: newStore.id, name: `Kho ${newStore.name}`, address: newStore.address },
      ]);
    }
    setShowForm(false);
    setEditingStore(undefined);
  };

  // Dashboard summary
  const activeStores = stores.filter((s) => s.isActive).length;
  const totalWarehouses = warehouses.length;
  const pendingTransfers = transfers.filter((t) => t.status === 'PENDING').length;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Quản lý chi nhánh</h1>
        <button onClick={handleCreate} style={styles.addButton}>
          + Thêm chi nhánh
        </button>
      </header>

      {/* Dashboard Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{activeStores}</div>
          <div style={styles.summaryLabel}>Chi nhánh hoạt động</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{totalWarehouses}</div>
          <div style={styles.summaryLabel}>Kho tổng</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{pendingTransfers}</div>
          <div style={styles.summaryLabel}>Chuyển kho đang chờ</div>
        </div>
      </div>

      {/* Stores List */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tên chi nhánh</th>
              <th style={styles.th}>Địa chỉ</th>
              <th style={styles.th}>Số điện thoại</th>
              <th style={styles.th}>Mã số thuế</th>
              <th style={styles.th}>Kho</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} style={styles.tr}>
                <td style={styles.td}>{store.name}</td>
                <td style={styles.td}>{store.address}</td>
                <td style={styles.td}>{store.phone}</td>
                <td style={styles.td}>{store.taxCode}</td>
                <td style={styles.td}>{warehouses.find((w) => w.id === store.warehouseId)?.name || '-'}</td>
                <td style={styles.td}>
                  <span style={store.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {store.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleEdit(store)}
                    style={styles.actionButton}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    style={{ ...styles.actionButton, backgroundColor: '#f44336', color: '#fff' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr>
                <td colSpan={7} style={styles.emptyTd}>
                  Chưa có chi nhánh nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingStore ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStore} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tên chi nhánh *</label>
                <input
                  type="text"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Địa chỉ *</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Số điện thoại *</label>
                <input
                  type="tel"
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mã số thuế *</label>
                <input
                  type="text"
                  value={storeForm.taxCode}
                  onChange={(e) => setStoreForm({ ...storeForm, taxCode: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                  Hủy
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingStore ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    backgroundColor: '#fff',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: '10px 16px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  summary: {
    display: 'flex',
    gap: '24px',
    padding: '24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e0e0e0',
  },
  summaryCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f0f7ff',
    borderRadius: '8px',
    flex: 1,
  },
  summaryValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1976d2',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#666',
  },
  tableContainer: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#fff',
    padding: '0 24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e0e0e0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555',
    backgroundColor: '#fafafa',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
    color: '#333',
  },
  tr: {
    backgroundColor: '#fff',
  },
  activeBadge: {
    padding: '4px 12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '12px',
    fontSize: '12px',
  },
  inactiveBadge: {
    padding: '4px 12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '12px',
    fontSize: '12px',
  },
  actionButton: {
    padding: '6px 12px',
    border: '1px solid #1976d2',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1976d2',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  emptyTd: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e0e0e0',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    width: '32px',
    height: '32px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '20px',
    color: '#666',
  },
  form: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    border: '1px solid #666',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#666',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
};

export default MultiStorePage;
