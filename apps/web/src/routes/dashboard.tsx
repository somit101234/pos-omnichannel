import React from 'react';
import { UserRole } from '../types/role';

interface DashboardStats {
  revenueToday: number;
  orderCount: number;
  topProducts: Array<{ name: string; quantity: number }>;
}

const Dashboard: React.FC = () => {
  // Mock data - in production, this would come from an API
  const stats: DashboardStats = {
    revenueToday: 12500000, // 12.5 triệu VNĐ
    orderCount: 48,
    topProducts: [
      { name: 'Cháo ếch', quantity: 25 },
      { name: 'Cơm sườn', quantity: 18 },
      { name: 'Bánh mì', quantity: 15 },
      { name: 'Nước ép', quantity: 12 },
      { name: 'Phở bò', quantity: 10 },
    ],
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Tổng quan</h1>
        </header>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Doanh thu hôm nay</div>
            <div style={styles.statValue}>{formatCurrency(stats.revenueToday)}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Số đơn hàng</div>
            <div style={styles.statValue}>{stats.orderCount}</div>
          </div>
        </div>

        <div style={styles.topProductsSection}>
          <h2 style={styles.sectionTitle}>Top 5 sản phẩm bán chạy</h2>
          <div style={styles.productsTable}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>STT</th>
                  <th style={styles.th}>Tên sản phẩm</th>
                  <th style={styles.th}>Số lượng bán</th>
                </tr>
              </thead>
              <tbody>
                {stats.topProducts.map((product, index) => (
                  <tr key={index} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>{product.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  content: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
  },
  header: {
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  statsGrid: {
    display: 'flex',
    gap: '24px',
    marginBottom: '32px',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1976d2',
  },
  topProductsSection: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
  },
  productsTable: {
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
};

export default Dashboard;
