import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductForm, { ProductFormValues } from '../../components/ProductForm';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  isBom: boolean;
  quantity: number;
}

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock data sản phẩm
  const [products, setProducts] = React.useState<Product[]>([
    {
      id: 'p1',
      name: 'Cháo ếch',
      barcode: '1234567890001',
      categoryId: 'cat1',
      categoryName: 'Cháo',
      unit: 'chén',
      costPrice: 8000,
      salePrice: 15000,
      minStock: 5,
      isBom: false,
      quantity: 20,
    },
    {
      id: 'p2',
      name: 'Cơm sườn',
      barcode: '1234567890002',
      categoryId: 'cat1',
      categoryName: 'Cơm',
      unit: 'suất',
      costPrice: 10000,
      salePrice: 20000,
      minStock: 5,
      isBom: false,
      quantity: 15,
    },
    {
      id: 'p3',
      name: 'Nồi cháo mẫu',
      barcode: '1234567890003',
      categoryId: 'cat2',
      categoryName: 'Vật tư',
      unit: 'nồi',
      costPrice: 150000,
      salePrice: 200000,
      minStock: 3,
      isBom: true,
      quantity: 10,
    },
    {
      id: 'p4',
      name: 'Hộp cháo',
      barcode: '1234567890004',
      categoryId: 'cat2',
      categoryName: 'Vật tư',
      unit: 'hộp',
      costPrice: 2000,
      salePrice: 5000,
      minStock: 50,
      isBom: false,
      quantity: 100,
    },
  ]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | undefined>(undefined);

  // Mock categories
  const categories = Array.from(new Set(products.map((p) => p.categoryId))).map((catId) => ({
    id: catId,
    name: products.find((p) => p.categoryId === catId)?.categoryName || catId,
  }));

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategoryId === null || product.categoryId === selectedCategoryId;
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery);
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategoryId]);

  const handleCreate = () => {
    setEditingProduct(undefined);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Xác nhận xóa sản phẩm?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleSaveProduct = (values: ProductFormValues) => {
    if (editingProduct) {
      // Update existing
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: values.name,
                barcode: values.barcode,
                categoryId: values.categoryId,
                unit: values.unit,
                costPrice: values.costPrice,
                salePrice: values.salePrice,
                minStock: values.minStock,
                isBom: values.isBom,
              }
            : p
        )
      );
    } else {
      // Create new
      const newProduct: Product = {
        id: `p${Date.now()}`,
        name: values.name,
        barcode: values.barcode,
        categoryId: values.categoryId,
        categoryName: categories.find((c) => c.id === values.categoryId)?.name || values.categoryId,
        unit: values.unit,
        costPrice: values.costPrice,
        salePrice: values.salePrice,
        minStock: values.minStock,
        isBom: values.isBom,
        quantity: 0,
      };
      setProducts((prev) => [...prev, newProduct]);
    }
    setShowForm(false);
    setEditingProduct(undefined);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Quản lý sản phẩm</h1>
        <button onClick={handleCreate} style={styles.addButton}>
          + Thêm sản phẩm
        </button>
      </header>

      {/* Filter & Search */}
      <div style={styles.filterBar}>
        <button
          style={{
            ...styles.filterButton,
            ...(selectedCategoryId === null ? styles.filterButtonActive : {}),
          }}
          onClick={() => setSelectedCategoryId(null)}
        >
          Tất cả
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            style={{
              ...styles.filterButton,
              ...(selectedCategoryId === category.id ? styles.filterButtonActive : {}),
            }}
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {category.name}
          </button>
        ))}
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Product list table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>STT</th>
              <th style={styles.th}>Tên sản phẩm</th>
              <th style={styles.th}>Barcode</th>
              <th style={styles.th}>Danh mục</th>
              <th style={styles.th}>Đơn vị</th>
              <th style={styles.th}>Giá vốn</th>
              <th style={styles.th}>Giá bán</th>
              <th style={styles.th}>Tồn</th>
              <th style={styles.th}>Tồn thấp</th>
              <th style={styles.th}>BOM</th>
              <th style={styles.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr key={product.id} style={index % 2 === 0 ? styles.trEven : styles.trOdd}>
                <td style={styles.td}>{index + 1}</td>
                <td style={styles.td}>
                  {product.name}
                  {product.isBom && <span style={styles.badge}>BOM</span>}
                </td>
                <td style={styles.td}>{product.barcode}</td>
                <td style={styles.td}>{product.categoryName}</td>
                <td style={styles.td}>{product.unit}</td>
                <td style={styles.td}>{formatCurrency(product.costPrice)}</td>
                <td style={styles.td}>{formatCurrency(product.salePrice)}</td>
                <td style={styles.td}>{product.quantity}</td>
                <td style={styles.td}>{product.quantity <= product.minStock ? '⚠️' : '-'}</td>
                <td style={styles.td}>{product.isBom ? 'Có' : 'Không'}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => handleEdit(product)}
                    style={styles.actionButton}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    style={{ ...styles.actionButton, backgroundColor: '#f44336', color: '#fff' }}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={11} style={styles.emptyTd}>
                  Không tìm thấy sản phẩm nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={styles.closeButton}>
                ✕
              </button>
            </div>
            <ProductForm
              initialValues={
                editingProduct
                  ? {
                      name: editingProduct.name,
                      barcode: editingProduct.barcode,
                      categoryId: editingProduct.categoryId,
                      unit: editingProduct.unit,
                      costPrice: editingProduct.costPrice,
                      salePrice: editingProduct.salePrice,
                      minStock: editingProduct.minStock,
                      isBom: editingProduct.isBom,
                      unitConversions: [],
                    }
                  : undefined
              }
              categories={categories}
              onSubmit={handleSaveProduct}
              onCancel={() => setShowForm(false)}
            />
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
  filterBar: {
    display: 'flex',
    gap: '8px',
    padding: '16px 24px',
    backgroundColor: '#fff',
    alignItems: 'center',
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
  searchBar: {
    marginLeft: 'auto',
  },
  searchInput: {
    padding: '10px 14px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '280px',
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
  badge: {
    display: 'inline-block',
    marginLeft: '8px',
    padding: '2px 8px',
    backgroundColor: '#ff9800',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
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
    maxWidth: '700px',
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
};

export default ProductsPage;
