import React from 'react';

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
  quantity: number;
}

interface ProductGridProps {
  products: Product[];
  selectedCategoryId: string | null;
  searchQuery: string;
  onSelectProduct: (product: Product) => void;
  onCategorySelect: (categoryId: string | null) => void;
  onSearchChange: (query: string) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  selectedCategoryId,
  searchQuery,
  onSelectProduct,
  onCategorySelect,
  onSearchChange,
}) => {
  const categories = Array.from(new Set(products.map((p) => p.categoryId))).map((catId) => ({
    id: catId,
    name: products.find((p) => p.categoryId === catId)?.categoryName || catId,
  }));

  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategoryId === null || product.categoryId === selectedCategoryId;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={styles.container}>
      {/* Category filter */}
      <div style={styles.filterBar}>
        <button
          style={{
            ...styles.categoryButton,
            ...(selectedCategoryId === null ? styles.categoryButtonActive : {}),
          }}
          onClick={() => onCategorySelect(null)}
        >
          Tất cả
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            style={{
              ...styles.categoryButton,
              ...(selectedCategoryId === category.id ? styles.categoryButtonActive : {}),
            }}
            onClick={() => onCategorySelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc barcode..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Product grid */}
      <div style={styles.grid}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            style={{
              ...styles.productCard,
              ...(product.quantity === 0 ? styles.productCardOut_of_stock : {}),
            }}
            onClick={() => onSelectProduct(product)}
          >
            <div style={styles.productName}>{product.name}</div>
            <div style={styles.productBarcode}>{product.barcode}</div>
            <div style={styles.productPrice}>
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND',
              }).format(product.salePrice)}
            </div>
            <div style={styles.productStock}>
              {'Tồn kho: ' + product.quantity + ' ' + product.unit}
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div style={styles.emptyState}>
            Không tìm thấy sản phẩm nào
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  categoryButton: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '20px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  categoryButtonActive: {
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
  },
  searchBar: {
    marginBottom: '16px',
  },
  searchInput: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: '12px',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'transform 0.1s',
  },
  productCardOut_of_stock: {
    backgroundColor: '#f5f5f5',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  productName: {
    fontWeight: '500',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#333',
  },
  productBarcode: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px',
  },
  productPrice: {
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: '8px',
  },
  productStock: {
    fontSize: '12px',
    color: '#666',
  },
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px',
    color: '#666',
  },
};

export default ProductGrid;
