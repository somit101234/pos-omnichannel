import React from 'react';

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'MANAGER' | 'CASHIER' | 'OWNER';
  isActive: boolean;
  createdAt: string;
}

const StaffPage: React.FC = () => {
  // Mock data
  const [staffs, setStaffs] = React.useState<Staff[]>([
    {
      id: 'st1',
      name: 'Nguyen Van A',
      email: 'a@example.com',
      phone: '0901 234 567',
      role: 'OWNER',
      isActive: true,
      createdAt: '2026-01-01',
    },
    {
      id: 'st2',
      name: 'Tran Thi B',
      email: 'b@example.com',
      phone: '0902 345 678',
      role: 'MANAGER',
      isActive: true,
      createdAt: '2026-02-15',
    },
    {
      id: 'st3',
      name: 'Le Van C',
      email: 'c@example.com',
      phone: '0903 456 789',
      role: 'CASHIER',
      isActive: false,
      createdAt: '2026-03-01',
    },
    {
      id: 'st4',
      name: 'Pham Thi D',
      email: 'd@example.com',
      phone: '0904 567 890',
      role: 'CASHIER',
      isActive: true,
      createdAt: '2026-04-10',
    },
  ]);

  const [showForm, setShowForm] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<Staff | undefined>(undefined);

  // Form state
  const [staffForm, setStaffForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER' as 'MANAGER' | 'CASHIER' | 'OWNER',
  });

  // Role badge style
  const getRoleStyle = (role: string): React.CSSProperties => {
    const styles: Record<string, React.CSSProperties> = {
      OWNER: { backgroundColor: '#ff9800', color: '#fff' },
      MANAGER: { backgroundColor: '#2196f3', color: '#fff' },
      CASHIER: { backgroundColor: '#4caf50', color: '#fff' },
    };
    return { ...styles[role], padding: '4px 12px', borderRadius: '12px', fontSize: '12px' };
  };

  // Filter by role
  const [filterRole, setFilterRole] = React.useState<string>('ALL');
  const filteredStaffs = React.useMemo(() => {
    if (filterRole === 'ALL') return staffs;
    return staffs.filter((s) => s.role === filterRole);
  }, [staffs, filterRole]);

  // Filter by active status
  const [filterActive, setFilterActive] = React.useState<string>('ALL');
  const displayedStaffs = React.useMemo(() => {
    if (filterActive === 'ALL') return filteredStaffs;
    return filteredStaffs.filter((s) => (filterActive === 'ACTIVE' ? s.isActive : !s.isActive));
  }, [filteredStaffs, filterActive]);

  const handleCreate = () => {
    setEditingStaff(undefined);
    setStaffForm({ name: '', email: '', phone: '', role: 'CASHIER' });
    setShowForm(true);
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      role: staff.role,
    });
    setShowForm(true);
  };

  const handleSoftDelete = (id: string) => {
    setStaffs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      // Update
      setStaffs((prev) =>
        prev.map((s) =>
          s.id === editingStaff.id
            ? { ...s, ...staffForm }
            : s
        )
      );
    } else {
      // Create
      const newStaff: Staff = {
        id: `st${Date.now()}`,
        name: staffForm.name,
        email: staffForm.email,
        phone: staffForm.phone,
        role: staffForm.role,
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setStaffs((prev) => [...prev, newStaff]);
    }
    setShowForm(false);
    setEditingStaff(undefined);
  };

  // Stats
  const activeStaffs = staffs.filter((s) => s.isActive).length;
  const managers = staffs.filter((s) => s.role === 'MANAGER').length;
  const cashiers = staffs.filter((s) => s.role === 'CASHIER').length;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Quản lý nhân viên</h1>
        <button onClick={handleCreate} style={styles.addButton}>
          + Thêm nhân viên
        </button>
      </header>

      {/* Stats */}
      <div style={styles.summary}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{activeStaffs}</div>
          <div style={styles.summaryLabel}>Nhân viên hoạt động</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{managers}</div>
          <div style={styles.summaryLabel}>Quản lý</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryValue}>{cashiers}</div>
          <div style={styles.summaryLabel}>Thu ngân</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Vai trò: </label>
          {['ALL', 'OWNER', 'MANAGER', 'CASHIER'].map((role) => (
            <button
              key={role}
              style={{
                ...styles.filterButton,
                ...(filterRole === role ? styles.filterButtonActive : {}),
              }}
              onClick={() => setFilterRole(role)}
            >
              {role === 'ALL' ? 'Tất cả' : role}
            </button>
          ))}
        </div>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Trạng thái: </label>
          {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
            <button
              key={status}
              style={{
                ...styles.filterButton,
                ...(filterActive === status ? styles.filterButtonActive : {}),
              }}
              onClick={() => setFilterActive(status)}
            >
              {status === 'ALL'
                ? 'Tất cả'
                : status === 'ACTIVE'
                ? 'Đang hoạt động'
                : 'Đã tắt'}
            </button>
          ))}
        </div>
      </div>

      {/* Staff List */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tên</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>SĐT</th>
              <th style={styles.th}>Vai trò</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Ngày tạo</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {displayedStaffs.map((staff) => (
              <tr key={staff.id} style={styles.tr}>
                <td style={styles.td}>{staff.name}</td>
                <td style={styles.td}>{staff.email}</td>
                <td style={styles.td}>{staff.phone}</td>
                <td style={styles.td}>
                  <span style={getRoleStyle(staff.role)}>{staff.role}</span>
                </td>
                <td style={styles.td}>
                  <span style={staff.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {staff.isActive ? 'Hoạt động' : 'Đã tắt'}
                  </span>
                </td>
                <td style={styles.td}>{staff.createdAt}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleEdit(staff)}
                    style={styles.actionButton}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleSoftDelete(staff.id)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: staff.isActive ? '#ff9800' : '#4caf50',
                      color: '#fff',
                    }}
                  >
                    {staff.isActive ? 'Tắt' : 'Kích hoạt'}
                  </button>
                </td>
              </tr>
            ))}
            {displayedStaffs.length === 0 && (
              <tr>
                <td colSpan={7} style={styles.emptyTd}>
                  Không tìm thấy nhân viên nào
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
                {editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStaff} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Tên nhân viên *</label>
                <input
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Số điện thoại *</label>
                <input
                  type="tel"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Vai trò *</label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as 'MANAGER' | 'CASHIER' | 'OWNER' })}
                  style={styles.input}
                  required
                >
                  <option value="OWNER">Chủ cửa hàng (Owner)</option>
                  <option value="MANAGER">Quản lý (Manager)</option>
                  <option value="CASHIER">Thu ngân (Cashier)</option>
                </select>
              </div>
              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                  Hủy
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingStaff ? 'Cập nhật' : 'Thêm'}
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
  filterBar: {
    display: 'flex',
    gap: '32px',
    padding: '16px 24px',
    backgroundColor: '#fff',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e0e0e0',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  filterButtonActive: {
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
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

export default StaffPage;
