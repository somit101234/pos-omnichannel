import React from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface ProductFormValues {
  name: string;
  barcode: string;
  categoryId: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStock: number;
  isBom: boolean;
  unitConversions: { unit: string; ratio: number }[];
}

export interface ProductFormProps {
  initialValues?: ProductFormValues;
  categories: { id: string; name: string }[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

const DEFAULT_UNITS = ['kg', 'g', 'lít', 'ml', 'cái', 'hộp', 'thùng'];

const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  categories,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = React.useState<ProductFormValues>({
    name: initialValues?.name || '',
    barcode: initialValues?.barcode || '',
    categoryId: initialValues?.categoryId || (categories[0]?.id || ''),
    unit: initialValues?.unit || 'cái',
    costPrice: initialValues?.costPrice || 0,
    salePrice: initialValues?.salePrice || 0,
    minStock: initialValues?.minStock || 0,
    isBom: initialValues?.isBom || false,
    unitConversions: initialValues?.unitConversions || [],
  });

  const handleInputChange = (
    field: keyof ProductFormValues,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateBarcode = () => {
    handleInputChange('barcode', uuidv4().replace(/-/g, '').substring(0, 12));
  };

  const handleAddUnitConversion = () => {
    setFormData((prev) => ({
      ...prev,
      unitConversions: [
        ...prev.unitConversions,
        { unit: '', ratio: 1 },
      ],
    }));
  };

  const handleUpdateUnitConversion = (
    index: number,
    field: 'unit' | 'ratio',
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      unitConversions: prev.unitConversions.map((conv, i) =>
        i === index ? { ...conv, [field]: value } : conv
      ),
    }));
  };

  const handleRemoveUnitConversion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      unitConversions: prev.unitConversions.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) {
      alert('Vui lòng điền tên và chọn danh mục');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Tên sản phẩm *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            style={styles.input}
            placeholder="Tên sản phẩm"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Danh mục *</label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            style={styles.select}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Barcode</label>
          <div style={styles.barcodeInputRow}>
            <input
              type="text"
              value={formData.barcode}
              onChange={(e) => handleInputChange('barcode', e.target.value)}
              style={styles.input}
              placeholder="Nhập hoặc 自动生成 barcode"
            />
            <button
              type="button"
              onClick={handleGenerateBarcode}
              style={styles.generateButton}
            >
              🎲 Tự động
            </button>
          </div>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Đơn vị tính chính *</label>
          <select
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            style={styles.select}
          >
            {DEFAULT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Giá vốn (VNĐ)</label>
          <input
            type="number"
            min="0"
            value={formData.costPrice}
            onChange={(e) =>
              handleInputChange('costPrice', Number(e.target.value))
            }
            style={styles.input}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Giá bán (VNĐ)</label>
          <input
            type="number"
            min="0"
            value={formData.salePrice}
            onChange={(e) =>
              handleInputChange('salePrice', Number(e.target.value))
            }
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.row}>
        <div style={styles.field}>
          <label style={styles.label}>Tồn tối thiểu</label>
          <input
            type="number"
            min="0"
            value={formData.minStock}
            onChange={(e) =>
              handleInputChange('minStock', Number(e.target.value))
            }
            style={styles.input}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Sản phẩm BOM</label>
          <div style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={formData.isBom}
              onChange={(e) => handleInputChange('isBom', e.target.checked)}
              id="isBom"
            />
            <label htmlFor="isBom" style={styles.checkboxLabel}>
              Sản phẩm có nguyên liệu BOM (khi bán trừ tồn nguyên liệu)
            </label>
          </div>
        </div>
      </div>

      {/* Unit conversion section */}
      {formData.unitConversions.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Tỷ lệ quy đổi đơn vị</h3>
          {formData.unitConversions.map((conv, index) => (
            <div key={index} style={styles.conversionRow}>
              <input
                type="text"
                value={conv.unit}
                onChange={(e) =>
                  handleUpdateUnitConversion(index, 'unit', e.target.value)
                }
                placeholder="Đơn vị (vd: nồi, hộp...)"
                style={styles.conversionInput}
              />
              <span style={styles.ratioLabel}>=</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={conv.ratio}
                onChange={(e) =>
                  handleUpdateUnitConversion(index, 'ratio', Number(e.target.value))
                }
                placeholder="Tỷ lệ (vd: 20)"
                style={styles.ratioInput}
              />
              <span style={styles.unitLabel}>{formData.unit}</span>
              <button
                type="button"
                onClick={() => handleRemoveUnitConversion(index)}
                style={styles.removeButton}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddUnitConversion}
            style={styles.addConversionButton}
          >
            + Thêm tỷ lệ quy đổi
          </button>
        </div>
      )}

      <div style={styles.actions}>
        <button type="button" onClick={onCancel} style={styles.cancelButton}>
          Hủy
        </button>
        <button type="submit" style={styles.submitButton}>
          {initialValues ? 'Cập nhật' : 'Tạo mới'}
        </button>
      </div>
    </form>
  );
};

const styles: Record<string, React.CSSProperties> = {
  form: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  row: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  field: {
    flex: 1,
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
  select: {
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    width: '100%',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  barcodeInputRow: {
    display: 'flex',
    gap: '8px',
  },
  generateButton: {
    padding: '10px 14px',
    backgroundColor: '#1976d2',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px',
  },
  checkboxLabel: {
    marginLeft: '8px',
    fontSize: '14px',
    color: '#333',
  },
  section: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '12px',
    color: '#333',
  },
  conversionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  conversionInput: {
    flex: 1,
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  ratioLabel: {
    fontSize: '14px',
    color: '#666',
  },
  ratioInput: {
    width: '100px',
    padding: '8px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  unitLabel: {
    fontSize: '14px',
    color: '#666',
  },
  removeButton: {
    width: '32px',
    height: '32px',
    border: '1px solid #f44336',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#f44336',
    cursor: 'pointer',
    fontSize: '16px',
  },
  addConversionButton: {
    padding: '8px 14px',
    border: '1px dashed #1976d2',
    borderRadius: '4px',
    backgroundColor: '#fff',
    color: '#1976d2',
    cursor: 'pointer',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    justifyContent: 'flex-end',
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

export default ProductForm;
