import React from 'react';
import RevenueChart from '../../components/RevenueChart';
import { useNavigate } from 'react-router-dom';

interface ReportData {
  date: string;
  revenue: number;
  profit: number;
  platformFee: number;
}

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock data báo cáo
  const [reportData, setReportData] = React.useState<ReportData[]>([
    { date: '2026-08-17', revenue: 12500000, profit: 4500000, platformFee: 1250000 },
    { date: '2026-08-18', revenue: 15800000, profit: 5200000, platformFee: 1580000 },
    { date: '2026-08-19', revenue: 18200000, profit: 6100000, platformFee: 1820000 },
    { date: '2026-08-20', revenue: 22500000, profit: 7800000, platformFee: 2250000 },
    { date: '2026-08-21', revenue: 19800000, profit: 6500000, platformFee: 1980000 },
    { date: '2026-08-22', revenue: 21300000, profit: 7200000, platformFee: 2130000 },
    { date: '2026-08-23', revenue: 24600000, profit: 8400000, platformFee: 2460000 },
  ]);

  // Filter options
  const [dateRange, setDateRange] = React.useState<'day' | 'week' | 'month' | 'custom'>('week');

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Convert report data to chart format
  const chartData = React.useMemo(() => {
    return reportData.map((d) => ({
      label: d.date.split('-').slice(2).join('/'), // DD/MM
      revenue: d.revenue,
      profit: d.profit,
    }));
  }, [reportData]);

  // Calculate totals
  const totals = React.useMemo(() => {
    const totalRevenue = reportData.reduce((sum, d) => sum + d.revenue, 0);
    const totalProfit = reportData.reduce((sum, d) => sum + d.profit, 0);
    const totalPlatformFee = reportData.reduce((sum, d) => sum + d.platformFee, 0);
    return { totalRevenue, totalProfit, totalPlatformFee };
  }, [reportData]);

  // Export to Excel (mock)
  const handleExport = () => {
    const headers = ['Date,Doanh thu,Lợi nhuận,Phí nền tảng\n'];
    const rows = reportData.map(d => `${d.date},${d.revenue},${d.profit},${d.platformFee}\n`);
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join('') + rows.join('');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bao_cao_doanh_thu_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Date range filter handlers
  const handleDateRangeChange = (range: 'day' | 'week' | 'month' | 'custom') => {
    setDateRange(range);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Báo cáo doanh thu</h1>
        <button onClick={handleExport} style={styles.exportButton}>
          📊 Xuất Excel
        </button>
      </header>

      {/* Date range filters */}
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Khoảng thời gian:</span>
        {(['day', 'week', 'month', 'custom'] as const).map((range) => (
          <button
            key={range}
            style={{
              ...styles.filterButton,
              ...(dateRange === range ? styles.filterButtonActive : {}),
            }}
            onClick={() => handleDateRangeChange(range)}
          >
            {range === 'day' && 'Hôm nay'}
            {range === 'week' && '7 ngày'}
            {range === 'month' && '30 ngày'}
            {range === 'custom' && 'Tùy chọn'}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Doanh thu</div>
          <div style={styles.summaryValue}>{formatCurrency(totals.totalRevenue)}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Lợi nhuận</div>
          <div style={{ ...styles.summaryValue, color: '#4caf50' }}>
            {formatCurrency(totals.totalProfit)}
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>Phí nền tảng</div>
          <div style={{ ...styles.summaryValue, color: '#f44336' }}>
            {formatCurrency(totals.totalPlatformFee)}
          </div>
        </div>
      </div>

      {/* Revenue chart */}
      <div style={{ marginTop: '24px' }}>
        <RevenueChart data={chartData} title="Doanh thu và Lợi nhuận theo ngày" />
      </div>

      {/* Profit breakdown table */}
      <div style={{ ...styles.tableContainer, marginTop: '24px' }}>
        <h3 style={styles.subtitle}>Chi tiết doanh thu theo ngày</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Ngày</th>
              <th style={styles.th}>Doanh thu</th>
              <th style={styles.th}>Giá vốn</th>
              <th style={styles.th}>Lợi nhuận</th>
              <th style={styles.th}>Phí nền tảng</th>
              <th style={styles.th}>Tỷ lệ lợi nhuận</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((d, index) => {
              const profitMargin = d.revenue > 0 ? ((d.profit / d.revenue) * 100).toFixed(1) : '0.0';
              return (
                <tr key={d.date} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{d.date}</td>
                  <td style={styles.td}>{formatCurrency(d.revenue)}</td>
                  <td style={styles.td}>{formatCurrency(d.revenue - d.profit - d.platformFee)}</td>
                  <td style={{ ...styles.td, color: '#4caf50', fontWeight: '600' }}>
                    {formatCurrency(d.profit)}
                  </td>
                  <td style={{ ...styles.td, color: '#f44336' }}>{formatCurrency(d.platformFee)}</td>
                  <td style={styles.td}>{profitMargin}%</td>
                </tr>
              );
            })}
            {reportData.length === 0 && (
              <tr>
                <td colSpan={6} style={styles.emptyTd}>
                  Không có dữ liệu báo cáo
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
  exportButton: {
    padding: '10px 16px',
    backgroundColor: '#2e7d32',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    padding: '16px 24px',
    backgroundColor: '#fff',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e0e0e0',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#666',
    marginRight: '8px',
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
  summaryGrid: {
    display: 'flex',
    gap: '24px',
    padding: '24px',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
  },
  tableContainer: {
    backgroundColor: '#fff',
    padding: '24px',
    margin: '0 24px 24px 24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  subtitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
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
};

export default ReportsPage;
