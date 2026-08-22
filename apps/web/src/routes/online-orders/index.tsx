import React from 'react';

export interface OnlineOrder {
  id: string;
  orderNo: string;
  platform: 'SHOPEE' | 'GRABFOOD' | 'BEOFORD';
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'DELIVERED';
  customerName: string;
  total: number;
  createdAt: string;
}

const OnlineOrdersPage: React.FC = () => {
  // Mock data đơn hàng online
  const [orders, setOrders] = React.useState<OnlineOrder[]>([
    {
      id: 'o1',
      orderNo: 'SP20260822-001',
      platform: 'SHOPEE',
      status: 'PENDING',
      customerName: 'Nguyen Van A',
      total: 85000,
      createdAt: '2026-08-22 10:30',
    },
    {
      id: 'o2',
      orderNo: 'GF20260822-002',
      platform: 'GRABFOOD',
      status: 'PROCESSING',
      customerName: 'Tran Thi B',
      total: 120000,
      createdAt: '2026-08-22 11:15',
    },
    {
      id: 'o3',
      orderNo: 'SP20260822-003',
      platform: 'SHOPEE',
      status: 'READY',
      customerName: 'Le Van C',
      total: 95000,
      createdAt: '2026-08-22 11:45',
    },
    {
      id: 'o4',
      orderNo: 'SP20260822-004',
      platform: 'SHOPEE',
      status: 'DELIVERED',
      customerName: 'Pham Thi D',
      total: 75000,
      createdAt: '2026-08-22 09:00',
    },
    {
      id: 'o5',
      orderNo: 'BF20260822-005',
      platform: 'BEOFORD',
      status: 'PENDING',
      customerName: 'Hoang Van E',
      total: 150000,
      createdAt: '2026-08-22 12:00',
    },
  ]);

  // Filter state
  const [filterStatus, setFilterStatus] = React.useState<string>('ALL');

  // Filter orders
  const filteredOrders = React.useMemo(() => {
    if (filterStatus === 'ALL') return orders;
    return orders.filter((order) => order.status === filterStatus);
  }, [orders, filterStatus]);

  // Handle accept/reject
  const handleAccept = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: 'PROCESSING' } : order
      )
    );
  };

  const handleReject = (orderId: string) => {
    if (window.confirm('Xác nhận từ chối đơn hàng?')) {
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    }
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Status styles
  const getStatusStyle = (status: string): React.CSSProperties => {
    const styles: Record<string, React.CSSProperties> = {
      PENDING: { backgroundColor: '#fff3cd', color: '#856404' },
      PROCESSING: { backgroundColor: '#cce5ff', color: '#004085' },
      READY: { backgroundColor: '#d4edda', color: '#155724' },
      DELIVERED: { backgroundColor: '#e2e3e5', color: '#383d41' },
    };
    return { ...styles[status], padding: '4px 12px', borderRadius: '12px', fontSize: '12px' };
  };

  // Alert check (order pending > 15 minutes)
  const isAlert = (order: OnlineOrder): boolean => {
    const createdAt = new Date(order.createdAt);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    return order.status === 'PENDING' && diffMinutes > 15;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Đơn hàng online</h1>
        <div style={styles.summary}>
          <span style={styles.stat}>{orders.filter((o) => o.status === 'PENDING').length} chờ</span>
          <span style={styles.stat}>{orders.filter((o) => o.status === 'PROCESSING').length} xử lý</span>
          <span style={styles.stat}>{orders.filter((o) => o.status === 'DELIVERED').length} giao</span>
        </div>
      </header>

      {/* Status Filter */}
      <div style={styles.filterBar}>
        {['ALL', 'PENDING', 'PROCESSING', 'READY', 'DELIVERED'].map((status) => (
          <button
            key={status}
            style={{
              ...styles.filterButton,
              ...(filterStatus === status ? styles.filterButtonActive : {}),
            }}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'ALL' ? 'Tất cả' : status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Mã đơn</th>
              <th style={styles.th}>Nền tảng</th>
              <th style={styles.th}>Khách hàng</th>
              <th style={styles.th}>Tổng</th>
              <th style={styles.th}>Trạng thái</th>
              <th style={styles.th}>Thời gian</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} style={styles.tr}>
                <td style={styles.td}>{order.orderNo}</td>
                <td style={styles.td}>{order.platform}</td>
                <td style={styles.td}>{order.customerName}</td>
                <td style={styles.td}>{formatCurrency(order.total)}</td>
                <td style={styles.td}>
                  <span style={getStatusStyle(order.status)}>
                    {order.status === 'PENDING' && isAlert(order) ? '⚠️ ' : ''}
                    {order.status}
                  </span>
                </td>
                <td style={styles.td}>{order.createdAt}</td>
                <td style={styles.td}>
                  {order.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleAccept(order.id)}
                        style={{ ...styles.actionButton, backgroundColor: '#4caf50', color: '#fff' }}
                      >
                        Chấp nhận
                      </button>
                      <button
                        onClick={() => handleReject(order.id)}
                        style={{ ...styles.actionButton, backgroundColor: '#f44336', color: '#fff' }}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                  {order.status !== 'PENDING' && (
                    <span style={styles.readonly}>Đã xử lý</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} style={styles.emptyTd}>
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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
  summary: {
    display: 'flex',
    gap: '24px',
  },
  stat: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    fontSize: '14px',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    padding: '16px 24px',
    backgroundColor: '#fff',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e0e0e0',
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
  actionButton: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  readonly: {
    color: '#666',
    fontSize: '12px',
  },
  emptyTd: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

export default OnlineOrdersPage;
