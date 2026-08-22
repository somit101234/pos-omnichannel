import React from 'react';

/**
 * Inventory Check page — US6: Kiểm kho cuối ngày
 * 
 * FR-028: Owner thực hiện inventory check — nhập actual qty cho từng sản phẩm
 * FR-029: Hệ thống tính variance = theoretical - actual
 * FR-030: Tính hao hụt cost = |variance| × unit_cost cho sản phẩm thiếu (deficit)
 */

interface ProductStock {
  productId: string;
  name: string;
  barcode: string;
  unit: string;
  theoreticalQty: number;
  actualQty: number;
  unitCost: number; // cents (integer)
}

interface VarianceRow {
  productId: string;
  name: string;
  theoreticalQty: number;
  actualQty: number;
  variance: number;
  lossCost: number;
  status: 'balanced' | 'deficit' | 'surplus';
}

const MOCK_STOCK: ProductStock[] = [
  { productId: 'p1', name: 'Cháo ếch', barcode: '1234567890001', unit: 'chén', theoreticalQty: 20, actualQty: 0, unitCost: 8000 },
  { productId: 'p2', name: 'Cơm sườn', barcode: '1234567890002', unit: 'suất', theoreticalQty: 15, actualQty: 0, unitCost: 10000 },
  { productId: 'p3', name: 'Bánh mì', barcode: '1234567890003', unit: 'cái', theoreticalQty: 30, actualQty: 0, unitCost: 3000 },
  { productId: 'p4', name: 'Nước ép', barcode: '1234567890004', unit: 'ly', theoreticalQty: 25, actualQty: 0, unitCost: 5000 },
  { productId: 'p5', name: 'Phở bò', barcode: '1234567890005', unit: 'bát', theoreticalQty: 10, actualQty: 0, unitCost: 12000 },
];

const InventoryCheck: React.FC = () => {
  const [stocks, setStocks] = React.useState<ProductStock[]>(MOCK_STOCK);
  const [results, setResults] = React.useState<VarianceRow[] | null>(null);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleActualQtyChange = (productId: string, value: number) => {
    setStocks(prev =>
      prev.map(s => s.productId === productId ? { ...s, actualQty: value } : s)
    );
    // Reset results when user changes values
    if (results) setResults(null);
  };

  const handleCheck = () => {
    const rows: VarianceRow[] = stocks.map(s => {
      const variance = s.theoreticalQty - s.actualQty;
      const lossCost = variance > 0 ? variance * s.unitCost : 0;
      let status: 'balanced' | 'deficit' | 'surplus';
      if (variance === 0) status = 'balanced';
      else if (variance > 0) status = 'deficit';
      else status = 'surplus';
      return {
        productId: s.productId,
        name: s.name,
        theoreticalQty: s.theoreticalQty,
        actualQty: s.actualQty,
        variance,
        lossCost,
        status,
      };
    });
    setResults(rows);
  };

  const totalLossCost = results ? results.reduce((sum, r) => sum + r.lossCost, 0) : 0;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <header style={styles.header}>
          <h1 style={styles.pageTitle}>Kiểm kho cuối ngày</h1>
          <p style={styles.subtitle}>So sánh tồn lý thuyết vs tồn thực tế</p>
        </header>

        {/* Input table */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Nhập tồn thực tế (actual qty)</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>STT</th>
                <th style={styles.th}>Sản phẩm</th>
                <th style={styles.th}>Đơn vị</th>
                <th style={styles.th}>Tồn lý thuyết</th>
                <th style={styles.th}>Tồn thực tế (actual)</th>
                <th style={styles.th}>Giá vốn / đơn vị</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s, i) => (
                <tr key={s.productId} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{s.name}</td>
                  <td style={styles.td}>{s.unit}</td>
                  <td style={styles.td}>{s.theoreticalQty}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      value={s.actualQty}
                      onChange={e => handleActualQtyChange(s.productId, parseInt(e.target.value) || 0)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.td}>{formatCurrency(s.unitCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Check button */}
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button onClick={handleCheck} style={styles.checkButton}>
            Tính biến động (check)
          </button>
        </div>

        {/* Results */}
        {results && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Kết quả kiểm kho</h2>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>STT</th>
                  <th style={styles.th}>Sản phẩm</th>
                  <th style={styles.th}>Tồn lý thuyết</th>
                  <th style={styles.th}>Tồn thực tế</th>
                  <th style={styles.th}>Biến động (variance)</th>
                  <th style={styles.th}>Hao hụt (loss cost)</th>
                  <th style={styles.th}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.productId} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={styles.td}>{r.name}</td>
                    <td style={styles.td}>{r.theoreticalQty}</td>
                    <td style={styles.td}>{r.actualQty}</td>
                    <td style={{
                      ...styles.td,
                      color: r.variance > 0 ? '#d32f2f' : r.variance < 0 ? '#388e3c' : '#555',
                      fontWeight: 'bold',
                    }}>
                      {r.variance > 0 ? `+${r.variance}` : r.variance}
                    </td>
                    <td style={{
                      ...styles.td,
                      color: r.lossCost > 0 ? '#d32f2f' : '#555',
                      fontWeight: r.lossCost > 0 ? 'bold' : 'normal',
                    }}>
                      {r.lossCost > 0 ? formatCurrency(r.lossCost) : '—'}
                    </td>
                    <td style={styles.td}>
                      <span style={
                        r.status === 'deficit' ? styles.badgeDeficit :
                        r.status === 'surplus' ? styles.badgeSurplus :
                        styles.badgeBalanced
                      }>
                        {r.status === 'deficit' ? 'THIẾU' :
                         r.status === 'surplus' ? 'DƯ' : 'ĐỒNG BỘ'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary */}
            <div style={styles.summary}>
              <div style={styles.summaryCard}>
                <div style={styles.summaryLabel}>Tổng hao hụt</div>
                <div style={{
                  ...styles.summaryValue,
                  color: totalLossCost > 0 ? '#d32f2f' : '#555',
                }}>
                  {totalLossCost > 0 ? formatCurrency(totalLossCost) : '—'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', minHeight: '100vh' },
  content: { flex: 1, padding: '24px', overflowY: 'auto' },
  header: { marginBottom: '24px' },
  pageTitle: { fontSize: '24px', fontWeight: '600', color: '#333', margin: 0 },
  subtitle: { fontSize: '14px', color: '#666', marginTop: '4px' },
  section: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  sectionTitle: { fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#333' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '12px', borderBottom: '2px solid #e0e0e0',
    fontSize: '14px', fontWeight: '600', color: '#555',
  },
  td: { padding: '12px', borderBottom: '1px solid #e0e0e0', fontSize: '14px', color: '#333' },
  trEven: { backgroundColor: '#fafafa' },
  trOdd: { backgroundColor: '#fff' },
  input: {
    width: '80px', padding: '6px 8px', border: '1px solid #ccc',
    borderRadius: '4px', fontSize: '14px',
  },
  checkButton: {
    padding: '12px 32px', backgroundColor: '#1976d2', color: '#fff',
    border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600',
    cursor: 'pointer',
  },
  summary: {
    display: 'flex', gap: '24px', justifyContent: 'center', marginTop: '24px',
  },
  summaryCard: {
    backgroundColor: '#fff', padding: '20px', borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)', minWidth: '200px', textAlign: 'center',
  },
  summaryLabel: { fontSize: '14px', color: '#666', marginBottom: '8px' },
  summaryValue: { fontSize: '24px', fontWeight: '600', color: '#1976d2' },
  badgeDeficit: {
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
    backgroundColor: '#ffebee', color: '#d32f2f', fontSize: '12px', fontWeight: 'bold',
  },
  badgeSurplus: {
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
    backgroundColor: '#e8f5e9', color: '#388e3c', fontSize: '12px', fontWeight: 'bold',
  },
  badgeBalanced: {
    display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
    backgroundColor: '#e3f2fd', color: '#1976d2', fontSize: '12px', fontWeight: 'bold',
  },
};

export default InventoryCheck;
