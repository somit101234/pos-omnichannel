import React from 'react';

export interface ImportedOrder {
  id: string;
  orderNo: string;
  product: string;
  quantity: number;
  salePrice: number;
  platformFee: number;
  total: number;
}

const PlatformImportPage: React.FC = () => {
  // State
  const [platform, setPlatform] = React.useState<'SHOPEE' | 'GRABFOOD' | 'BEOFORD'>('SHOPEE');
  const [file, setFile] = React.useState<File | null>(null);
  const [importedData, setImportedData] = React.useState<ImportedOrder[]>([]);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  // Mock preview data (trước khi import thật)
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handlePreview = () => {
    if (!file) return;

    setIsProcessing(true);

    // Mock processing delay
    setTimeout(() => {
      // Mock data từ file Excel
      const mockData: ImportedOrder[] = [
        {
          id: 'io1',
          orderNo: 'SP20260822-001',
          product: 'Cháo ếch',
          quantity: 5,
          salePrice: 15000,
          platformFee: 7500, // 5%
          total: 82500,
        },
        {
          id: 'io2',
          orderNo: 'SP20260822-002',
          product: 'Cơm sườn',
          quantity: 3,
          salePrice: 20000,
          platformFee: 3000, // 5%
          total: 63000,
        },
        {
          id: 'io3',
          orderNo: 'SP20260822-003',
          product: 'Hộp cháo',
          quantity: 20,
          salePrice: 5000,
          platformFee: 500, // 5%
          total: 105000,
        },
      ];
      setImportedData(mockData);
      setIsProcessing(false);
      setShowPreview(true);
    }, 800);
  };

  const handleConfirm = () => {
    if (importedData.length > 0) {
      setShowPreview(false);
      setShowConfirm(true);
      // Mock successful import
      setTimeout(() => {
        alert('Import thành công! Đã thêm ' + importedData.length + ' đơn hàng.');
        setFile(null);
        setImportedData([]);
        setShowConfirm(false);
      }, 1000);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  // Total stats
  const totalQuantity = importedData.reduce((sum, item) => sum + item.quantity, 0);
  const totalPlatformFee = importedData.reduce((sum, item) => sum + item.platformFee, 0);
  const totalAmount = importedData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Import đơn hàng nền tảng</h1>
      </header>

      {/* Upload Section */}
      <div style={styles.uploadSection}>
        <div style={styles.uploadCard}>
          <h2 style={styles.sectionTitle}>1. Upload file Excel</h2>
          <div style={styles.platformSelector}>
            <label style={styles.label}>Nền tảng: </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as 'SHOPEE' | 'GRABFOOD' | 'BEOFORD')}
              style={styles.select}
            >
              <option value="SHOPEE">Shopee</option>
              <option value="GRABFOOD">GrabFood</option>
              <option value="BEOFORD">BeFood</option>
            </select>
          </div>
          <div style={styles.fileUpload}>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={styles.fileInput}
            />
            <span style={styles.fileText}>
              {file ? file.name : 'Chọn file Excel (.xlsx, .xls)'}
            </span>
          </div>
          <button
            onClick={handlePreview}
            disabled={!file || isProcessing}
            style={{
              ...styles.button,
              ...(isProcessing ? styles.buttonDisabled : {}),
            }}
          >
            {isProcessing ? 'Đang xử lý...' : 'Xem trước'}
          </button>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div style={styles.previewSection}>
          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <h2 style={styles.sectionTitle}>2. Xem trước dữ liệu</h2>
              <div style={styles.stats}>
                <span>{importedData.length} đơn</span>
                <span>{totalQuantity} sản phẩm</span>
                <span>{formatCurrency(totalAmount)}</span>
                <span>{formatCurrency(totalPlatformFee)} phí nền tảng</span>
              </div>
            </div>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Mã đơn</th>
                    <th style={styles.th}>Sản phẩm</th>
                    <th style={styles.th}>SL</th>
                    <th style={styles.th}>Giá bán</th>
                    <th style={styles.th}>Phí nền tảng</th>
                    <th style={styles.th}>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {importedData.map((item) => (
                    <tr key={item.id} style={styles.tr}>
                      <td style={styles.td}>{item.orderNo}</td>
                      <td style={styles.td}>{item.product}</td>
                      <td style={styles.td}>{item.quantity}</td>
                      <td style={styles.td}>{formatCurrency(item.salePrice)}</td>
                      <td style={styles.td}>{formatCurrency(item.platformFee)}</td>
                      <td style={styles.td}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={styles.previewActions}>
              <button
                onClick={() => setShowPreview(false)}
                style={{ ...styles.button, backgroundColor: '#666', color: '#fff' }}
              >
                Chỉnh sửa
              </button>
              <button
                onClick={handleConfirm}
                style={{ ...styles.button, backgroundColor: '#4caf50', color: '#fff' }}
              >
                Xác nhận import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Section */}
      {showConfirm && (
        <div style={styles.confirmSection}>
          <div style={styles.confirmCard}>
            <h2 style={styles.sectionTitle}>3. Xác nhận import</h2>
            <div style={styles.confirmInfo}>
              <p>Import {importedData.length} đơn hàng từ nền tảng {platform}?</p>
              <p>
                Tổng: {formatCurrency(totalAmount)} | Phí nền tảng: {formatCurrency(totalPlatformFee)}
              </p>
            </div>
            <div style={styles.confirmActions}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ ...styles.button, backgroundColor: '#666', color: '#fff' }}
              >
                Hủy
              </button>
              <button
                onClick={handleConfirm}
                style={{ ...styles.button, backgroundColor: '#4caf50', color: '#fff' }}
              >
                Import ngay
              </button>
            </div>
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
    borderBottom: '1px solid #e0e0e0',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
    color: '#333',
  },
  uploadSection: {
    padding: '24px',
  },
  uploadCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  platformSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  select: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  fileUpload: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
  },
  fileInput: {
    display: 'none',
  },
  fileText: {
    fontSize: '14px',
    color: '#666',
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
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  previewSection: {
    padding: '0 24px 24px 24px',
  },
  previewCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  stats: {
    display: 'flex',
    gap: '24px',
  },
  tableContainer: {
    overflowX: 'auto',
    marginBottom: '16px',
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
  previewActions: {
    display: 'flex',
    gap: '12px',
  },
  confirmSection: {
    padding: '0 24px 24px 24px',
  },
  confirmCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  confirmInfo: {
    padding: '16px',
    backgroundColor: '#f0f7ff',
    borderRadius: '4px',
    marginBottom: '16px',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
};

export default PlatformImportPage;
