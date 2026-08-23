import React from 'react';
import PoForm, { PoFormValues, PoItem } from '../../components/PoForm';

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PoItem[];
  status: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  totalAmount: number;
}

const SuppliersPage: React.FC = () => {
  // Mock data suppliers
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([
    { id: 's1', name: 'Công ty Thực phẩm A', phone: '0901234567', address: '123 Đường ABC, Quận 1, TP.HCM' },
    { id: 's2', name: 'Cửa hàng Nguyên liệu B', phone: '0912345678', address: '456 Đường XYZ, Quận 3, TP.HCM' },
    { id: 's3', name: 'Nhà cung cấp C', phone: '0923456789', address: '789 Đường DEF, Quận 5, TP.HCM' },
  ]);

  // Mock data POs
  const [pos, setPos] = React.useState<PurchaseOrder[]>([
    {
      id: 'po1',
      supplierId: 's1',
      supplierName: 'Công ty Thực phẩm A',
      items: [
        { productId: 'p1', productName: 'Cháo ếch', quantity: 5, unitPrice: 8000 },
        { productId: 'p2', productName: 'Hộp cháo', quantity: 50, unitPrice: 2000 },
      ],
      status: 'PENDING',
      createdAt: '2026-08-22T10:00:00Z',
      totalAmount: 5 * 8000 + 50 * 2000,
    },
    {
      id: 'po2',
      supplierId: 's2',
      supplierName: 'Cửa hàng Nguyên liệu B',
      items: [
        { productId: 'p3', productName: 'Nồi cháo mẫu', quantity: 2, unitPrice: 150000 },
      ],
      status: 'COMPLETED',
      createdAt: '2026-08-21T14:30:00Z',
      totalAmount: 2 * 150000,
    },
  ]);

  const [showForm, setShowForm] = React.useState(false);
  const [editingSupplier, setEditingSupplier] = React.useState<Supplier | undefined>(undefined);
  const [selectedSupplierFilter, setSelectedSupplierFilter] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter suppliers
  const filteredSuppliers = React.useMemo(() => {
    return suppliers.filter((supplier) => {
      const matchesSearch =
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        supplier.phone.includes(searchQuery) ||
        supplier.address.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [suppliers, searchQuery]);

  // Filter POs by supplier
  const filteredPos = React.useMemo(() => {
    return pos.filter((po) => {
      const matchesSupplier = selectedSupplierFilter === null || po.supplierId === selectedSupplierFilter;
      return matchesSupplier;
    });
  }, [pos, selectedSupplierFilter]);

  const handleCreateSupplier = () => {
    setEditingSupplier(undefined);
    setShowForm(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleDeleteSupplier = (id: string) => {
    if (window.confirm('Xác nhận xóa nhà cung cấp?')) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveSupplier = (values: { name: string; phone: string; address: string }) => {
    if (editingSupplier) {
      // Update
      setSuppliers((prev) =>
        prev.map((s) => (s.id === editingSupplier.id ? { ...s, ...values } : s))
      );
    } else {
      // Create
      const newSupplier: Supplier = {
        id: `s${Date.now()}`,
        name: values.name,
        phone: values.phone,
        address: values.address,
      };
      setSuppliers((prev) => [...prev, newSupplier]);
    }
    setShowForm(false);
    setEditingSupplier(undefined);
  };

  const handleCreatePO = () => {
    // TODO: Open PO creation modal
    alert('Chức năng tạo PO sẽ được implement sau');
  };

  const handleReceiveGoods = (poId: string) => {
    // TODO: Open receive goods modal with weighted avg calculation
    alert(`Chức năng nhận hàng cho PO ${poId} sẽ được implement sau`);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    const styles = {
      PENDING: { backgroundColor: '#ff9800', color: '#fff' },
      PARTIAL: { backgroundColor: '#9c27b0', color: '#fff' },
      COMPLETED: { backgroundColor: '#4caf50', color: '#fff' },
      CANCELLED: { backgroundColor: '#f44336', color: '#fff' },
    };
    return (
      <span style={{ ...styles[status], padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
        {status === 'PENDING' && 'Đang chờ'}
        {status === 'PARTIAL' && 'Một phần'}
        {status === 'COMPLETED' && 'Hoàn thành'}
        {status === 'CANCELLED' && 'Đã hủy'}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Nhập hàng & Nhà cung cấp</h1>
        <div style={styles.actions}>
          <button onClick={handleCreateSupplier} style={styles.primaryButton}>
            + Nhà cung cấp
          </button>
        </div>
      </header>

      {/* Supplier section */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Danh sách nhà cung cấp</h2>
          <div style={styles.supplierSearch}>
            <input
              type="text"
              placeholder="Tìm kiếm nhà cung cấp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>STT</th>
                <th style={styles.th}>Tên</th>
                <th style={styles.th}>SĐT</th>
                <th style={styles.th}>Địa chỉ</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier, index) => (
                <tr key={supplier.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{supplier.name}</td>
                  <td style={styles.td}>{supplier.phone}</td>
                  <td style={styles.td}>{supplier.address}</td>
                  <td style={styles.td}>
                    <button onClick={() => handleEditSupplier(supplier)} style={styles.actionButton}>
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      style={{ ...styles.actionButton, backgroundColor: '#f44336', color: '#fff' }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={5} style={styles.emptyTd}>
                    Không tìm thấy nhà cung cấp nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* PO section */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Danh sách đơn nhập hàng</h2>
          <div style={styles.poActions}>
            <select
              value={selectedSupplierFilter || ''}
              onChange={(e) => setSelectedSupplierFilter(e.target.value || null)}
              style={styles.select}
            >
              <option value="">Tất cả nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button onClick={handleCreatePO} style={styles.primaryButton}>
              + Đơn nhập hàng
            </button>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Mã PO</th>
                <th style={styles.th}>Nhà cung cấp</th>
                <th style={styles.th}>Sản phẩm</th>
                <th style={styles.th}>Tổng</th>
                <th style={styles.th}>Trạng thái</th>
                <th style={styles.th}>Ngày tạo</th>
                <th style={styles.th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredPos.map((po, index) => (
                <tr key={po.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{po.id}</td>
                  <td style={styles.td}>{po.supplierName}</td>
                  <td style={styles.td}>
                    {po.items.map((item) => `${item.productName} x${item.quantity}`).join(', ')}
                  </td>
                  <td style={styles.td}>{formatCurrency(po.totalAmount)}</td>
                  <td style={styles.td}>{getStatusBadge(po.status)}</td>
                  <td style={styles.td}>{new Date(po.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleReceiveGoods(po.id)}
                      style={{ ...styles.actionButton, backgroundColor: '#4caf50', color: '#fff' }}
                    >
                      Nhận hàng
                    </button>
                  </td>
                </tr>
              ))}
              {filteredPos.length === 0 && (
                <tr>
                  <td colSpan={7} style={styles.emptyTd}>
                    Không tìm thấy đơn nhập hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Supplier form modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={styles.closeButton}>✕</button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
                const phone = (e.currentTarget.elements.namedItem('phone') as HTMLInputElement).value;
                const address = (e.currentTarget.elements.namedItem('address') as HTMLInputElement).value;
                handleSaveSupplier({ name, phone, address });
              }}
              style={styles.form}
            >
              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label style={styles.label}>Tên *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingSupplier?.name || ''}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label style={styles.label}>SĐT *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    defaultValue={editingSupplier?.phone || ''}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formField}>
                  <label style={styles.label}>Địa chỉ *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    defaultValue={editingSupplier?.address || ''}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                  Hủy
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingSupplier ? 'Cập nhật' : 'Tạo mới'}
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
  actions: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    padding: '10px 16px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    margin: '16px',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  supplierSearch: {
    minWidth: '250px',
  },
  poActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  searchInput: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  tableContainer: {
    overflowX: 'auto',
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
  trEven: {
    backgroundColor: '#fafafa',
  },
  trOdd: {
    backgroundColor: '#fff',
  },
  emptyTd: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
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
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
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
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    marginBottom: '16px',
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '6px',
    color: '#333',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
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
  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
};

export default SuppliersPage;
