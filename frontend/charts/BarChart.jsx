// src/components/charts/BarChart.jsx
import React from 'react';

export default function BarChart({ data, values, labels }) {
  // Determine which data source to use
  let chartData = [];
  if (data && Array.isArray(data) && data.length > 0) {
    // New usage: data = [{ label, value }, ...]
    chartData = data;
  } else if (values && Array.isArray(values)) {
    // Old usage: values and labels arrays
    const lbls = labels || values.map((_, i) => `Tháng ${i+1}`);
    chartData = values.map((val, idx) => ({ label: lbls[idx], value: val }));
  } else {
    // No valid data
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        Không có dữ liệu biểu đồ
      </div>
    );
  }

  // Find max value for scaling (height in %)
  const maxValue = Math.max(...chartData.map(item => item.value), 0);
  const getHeightPercent = (value) => (maxValue === 0 ? 0 : (value / maxValue) * 100);

  return (
    <div className="bar-chart" style={{ height: 260, width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: '100%' }}>
        {chartData.map((item, idx) => {
          const heightPercent = getHeightPercent(item.value);
          return (
            <div key={idx} className="bar-item" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div className="bar-track" style={{ height: 210, width: '100%', background: '#eef2ff', borderRadius: '10px 10px 0 0', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  className="bar-fill"
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    background: 'linear-gradient(90deg, #b6c0ed, #2637b0)',
                    borderRadius: '8px 8px 0 0',
                    transition: 'height 0.3s ease'
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: '#6f7687' }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}