import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function DonutChart({ work = 0, leave = 0, absent = 0 }) {
  // Đảm bảo dữ liệu luôn là số thực, không bị NaN
  const safeWork = Number(work) || 0;
  const safeLeave = Number(leave) || 0;
  const safeAbsent = Number(absent) || 0;

  const total = safeWork + safeLeave + safeAbsent;

  // Nếu tổng = 0, gán 1 mảng dữ liệu giả để vẽ ra vòng xám
  const data = total > 0 ? [
    { name: 'Ngày công', value: safeWork, color: '#3b82f6' },
    { name: 'Nghỉ phép', value: safeLeave, color: '#a855f7' },
    { name: 'Vắng mặt', value: safeAbsent, color: '#ef4444' },
  ] : [
    { name: 'Chưa có dữ liệu', value: 1, color: '#e5e7eb' }
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '220px' }}>
      <PieChart width={250} height={220}>
        <Pie
          data={data}
          cx={125} // Tọa độ tâm cố định (một nửa của width 250)
          cy={110} // Tọa độ tâm cố định (một nửa của height 220)
          innerRadius={60}
          outerRadius={80}
          paddingAngle={total > 0 ? 5 : 0}
          dataKey="value"
          stroke="none"
          isAnimationActive={false} // BƯỚC NGOẶT: Tắt animation để fix lỗi tàng hình
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value) => total === 0 ? ['0', 'Số lượng'] : [`${value} ngày`, 'Tổng cộng']}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
      </PieChart>
    </div>
  );
}