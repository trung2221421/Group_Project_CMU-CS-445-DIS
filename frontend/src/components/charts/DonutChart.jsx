// src/components/charts/DonutChart.jsx
import React from 'react';

export default function DonutChart({ work, leave, absent, value, label }) {
  let rateValue = null;
  let displayLabel = 'Tỷ lệ đi làm';

  // Priority: if work/leave/absent are provided (new usage)
  if (work !== undefined || leave !== undefined || absent !== undefined) {
    const w = Number(work) || 0;
    const l = Number(leave) || 0;
    const a = Number(absent) || 0;
    const total = w + l + a;
    if (total > 0) {
      rateValue = (w / total) * 100;
    } else {
      rateValue = 0;
    }
    displayLabel = label || 'Tỷ lệ đi làm';
  } 
  // Fallback to old usage: value prop (percentage)
  else if (value !== undefined) {
    rateValue = Math.min(100, Math.max(0, Number(value)));
    displayLabel = label || 'Tỷ lệ đi làm';
  } 
  // No data
  else {
    rateValue = 0;
    displayLabel = 'Không có dữ liệu';
  }

  const deg = rateValue * 3.6; // 100% = 360deg
  const finalRate = rateValue.toFixed(1);

  return (
    <div
      className="donut"
      style={{
        '--value': `${deg}deg`,
        width: 150,
        height: 150,
        margin: '24px auto',
        borderRadius: '50%',
        background: `conic-gradient(#2335b0 var(--value), #47a1ff var(--value) calc(var(--value) + 35deg), #eef2f7 0)`,
        display: 'grid',
        placeItems: 'center'
      }}
    >
      <div
        className="donut-inner"
        style={{
          width: 104,
          height: 104,
          borderRadius: '50%',
          background: '#fff',
          display: 'grid',
          placeItems: 'center',
          alignContent: 'center'
        }}
      >
        <strong style={{ fontSize: 28 }}>{finalRate}%</strong>
        <span style={{ fontSize: 11, textTransform: 'uppercase', color: '#7b8498' }}>{displayLabel}</span>
      </div>
    </div>
  );
}