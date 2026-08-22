import React from 'react';

export interface Shift {
  id: string;
  cashierName: string;
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  status: 'ACTIVE' | 'ENDED' | 'FORCE_CLOSED';
  totalSales: number;
}

const ShiftPage: React.FC = () => {
  // Mock data
  const [currentShift, setCurrentShift] = React.useState<Shift | null>({
    id: 'sh1',
    cashierName: 'Nguyen Van A',
    startTime: '2026-08-22 08:00',
    status: 'ACTIVE',
    totalSales: 250000,
  });

  const [shiftHistory, setShiftHistory] = React.useState<Shift[]>([
    {
      id: 'sh1',
      cashierName: 'Nguyen Van A',
      startTime: '2026-08-22 08:00',
      endTime: undefined,
      status: 'ACTIVE',
      totalSales: 250000,
    },
    {
      id: 'sh2',
      cashierName: 'Tran Thi B',
      startTime: '2026-08-21 14:00',
      endTime: '2026-08-21 22:00',
      duration: 480,
      status: 'ENDED',
      totalSales: 450000,
    },
    {
      id: 'sh3',
      cashierName: 'Le Van C',
      startTime: '2026-08-21 08:00',
      endTime: '2026-08-21 16:00',
      duration: 480,
      status: 'ENDED',
      totalSales: 380000,
    },
  ]);

  // Handle start shift
  const handleStartShift = () => {
    setCurrentShift({
      id: `sh${Date.now()}`,
      cashierName: 'Nguyen Van A',
      startTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'ACTIVE',
      totalSales: 0,
    });
  };

  // Handle end shift
  const handleEndShift = () => {
    if (!currentShift) return;
    const endTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const start = new Date(currentShift.startTime);
    const end = new Date(endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    const endedShift: Shift = {
      ...currentShift,
      endTime,
      duration,
      status: 'ENDED',
    };

    setShiftHistory((prev) => [endedShift, ...prev]);
    setCurrentShift(null);
  };

  // Handle force close (manager action)
  const handleForceClose = () => {
    if (!currentShift) return;
    const endedShift: Shift = {
      ...currentShift,
      endTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      duration: 0,
      status: 'FORCE_CLOSED',
    };
    setShiftHistory((prev) => [endedShift, ...prev]);
    setCurrentShift(null);
  };

  // Alert: shift > 8 hours
  const isShiftAlert = (shift: Shift): boolean => {
    if (!shift.startTime || !shift.endTime || shift.status !== 'ENDED') return false;
    return (shift.duration || 0) > 480;
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Status badge style
  const getStatusStyle = (status: string): React.CSSProperties => {
    const styles: Record<string, React.CSSProperties> = {
      ACTIVE: { backgroundColor: '#d4edda', color: '#155724' },
      ENDED: { backgroundColor: '#e2e3e5', color: '#383d41' },
      FORCE_CLOSED: { backgroundColor: '#f8d7da', color: '#721c24' },
    };
    return { ...styles[status], padding: '4px 12px', borderRadius: '12px', fontSize: '12px' };
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Quản lý ca làm</h1>
        <div style={styles.summary}>
          <span style={styles.stat}>{shiftHistory.filter((s) => s.status === 'ACTIVE').length} đang làm</span>
        </div>
      </header>

      {/* Active Shift Card */}
      {currentShift ? (
        <div style={styles.activeShiftCard}>
          <div style={styles.activeShiftHeader}>
            <h2 style={styles.activeShiftTitle}>Ca hiện tại</h2>
            <span style={getStatusStyle(currentShift.status)}>
              {currentShift.status}
            </span>
          </div>
          <div style={styles.activeShiftContent}>
            <div style={styles.activeShiftInfo}>
              <div>
                <label style={styles.label}>Thu ngân</label>
                <div style={styles.value}>{currentShift.cashierName}</div>
              </div>
              <div>
                <label style={styles.label}>Bắt đầu</label>
                <div style={styles.value}>{currentShift.startTime}</div>
              </div>
              <div>
                <label style={styles.label}>Doanh thu</label>
                <div style={styles.value}>{formatCurrency(currentShift.totalSales)}</div>
              </div>
            </div>
            <button
              onClick={handleEndShift}
              style={{ ...styles.button, backgroundColor: '#4caf50', color: '#fff' }}
            >
              Kết thúc ca
            </button>
          </div>
          {currentShift.startTime && (
            <div style={styles.alertBar}>
              <span>⚠️ Alert: </span>
              <span>
                Thời gian làm việc: {(() => {
                  const start = new Date(currentShift.startTime);
                  const now = new Date();
                  const diffMinutes = Math.round((now.getTime() - start.getTime()) / (1000 * 60));
                  return diffMinutes;
                })()} phút
              </span>
              {(() => {
                const start = new Date(currentShift.startTime);
                const now = new Date();
                const diffMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
                return diffMinutes > 480 ? (
                  <span style={styles.alertText}>超过 8 giờ!</span>
                ) : null;
              })()}
            </div>
          )}
          <button
            onClick={handleForceClose}
            style={{ ...styles.button, backgroundColor: '#ff9800', color: '#fff', marginTop: '8px' }}
          >
            Force close (Quản lý)
          </button>
        </div>
      ) : (
        <div style={styles.noActiveShift}>
          <p style={styles.noActiveShiftText}>Không có ca làm hiện tại</p>
          <button onClick={handleStartShift} style={styles.button}>
            Bắt đầu ca mới
          </button>
        </div>
      )}

      {/* History Table */}
      <div style={styles.historySection}>
        <h3 style={styles.historyTitle}>Lịch sử ca làm</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Thu ngân</th>
                <th style={styles.th}>Bắt đầu</th>
                <th style={styles.th}>Kết thúc</th>
                <th style={styles.th}>Thời gian</th>
                <th style={styles.th}>Doanh thu</th>
                <th style={styles.th}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {shiftHistory.map((shift) => (
                <tr key={shift.id} style={styles.tr}>
                  <td style={styles.td}>{shift.cashierName}</td>
                  <td style={styles.td}>{shift.startTime}</td>
                  <td style={styles.td}>{shift.endTime || '-'}</td>
                  <td style={styles.td}>
                    {shift.duration ? formatDuration(shift.duration) : '-'}
                  </td>
                  <td style={styles.td}>{formatCurrency(shift.totalSales)}</td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(shift.status)}>
                      {shift.status}
                      {isShiftAlert(shift) ? ' ⚠️ (>8h)' : ''}
                    </span>
                  </td>
                </tr>
              ))}
              {shiftHistory.length === 0 && (
                <tr>
                  <td colSpan={6} style={styles.emptyTd}>
                    Chưa có lịch sử ca làm
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
    gap: '16px',
  },
  stat: {
    padding: '8px 16px',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    fontSize: '14px',
  },
  activeShiftCard: {
    margin: '24px',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  activeShiftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  activeShiftTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  activeShiftContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  activeShiftInfo: {
    display: 'flex',
    gap: '32px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px',
  },
  value: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  button: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#1976d2',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  alertBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    backgroundColor: '#fff3cd',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  alertText: {
    color: '#856404',
    fontWeight: '600',
  },
  noActiveShift: {
    margin: '24px',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    textAlign: 'center',
  },
  noActiveShiftText: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '16px',
  },
  historySection: {
    margin: '0 24px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  historyTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
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
  tr: {
    backgroundColor: '#fff',
  },
  emptyTd: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

export default ShiftPage;
