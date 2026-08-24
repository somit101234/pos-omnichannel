import React from 'react';

export interface RevenueData {
  label: string;
  revenue: number;
  profit: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  title?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

const RevenueChart: React.FC<RevenueChartProps> = ({ data, title = 'Biểu đồ doanh thu' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>{title}</h3>
        <div style={styles.empty}>Không có dữ liệu</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.revenue, d.profit)));
  const chartHeight = 200;
  const chartWidth = 800;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i * (chartWidth - 2 * padding)) / (data.length - 1);
    const revenueY = chartHeight - padding - (d.revenue / maxValue) * (chartHeight - 2 * padding);
    const profitY = chartHeight - padding - (d.profit / maxValue) * (chartHeight - 2 * padding);
    return { x, revenueY, profitY, label: d.label, revenue: d.revenue, profit: d.profit };
  });

  const revenuePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.revenueY}`).join(' ');
  const profitPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.profitY}`).join(' ');

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>
      <div style={styles.legend}>
        <span style={{ ...styles.legendItem, color: '#1976d2' }}>● Doanh thu</span>
        <span style={{ ...styles.legendItem, color: '#4caf50' }}>● Lợi nhuận</span>
      </div>
      <svg width={chartWidth} height={chartHeight} style={styles.chart}>
        {/* Axes */}
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#666" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#666" strokeWidth="1" />
        
        {/* Revenue line */}
        <path d={revenuePath} fill="none" stroke="#1976d2" strokeWidth="3" />
        
        {/* Profit line */}
        <path d={profitPath} fill="none" stroke="#4caf50" strokeWidth="3" />
        
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            {/* Revenue point */}
            <circle cx={p.x} cy={p.revenueY} r="5" fill="#1976d2" />
            {/* Profit point */}
            <circle cx={p.x} cy={p.profitY} r="5" fill="#4caf50" />
            
            {/* X-axis label */}
            <text x={p.x} y={chartHeight - 10} textAnchor="middle" fontSize="12" fill="#666">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  title: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  legend: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
  },
  legendItem: {
    fontSize: '14px',
  },
  chart: {
    display: 'block',
    width: '100%',
  },
};

export default RevenueChart;
