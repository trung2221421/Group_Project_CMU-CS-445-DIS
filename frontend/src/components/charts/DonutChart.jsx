import React from 'react';
// 1. Import thêm Legend từ recharts
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

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
    // 2. Tăng chiều cao của div bao bọc lên một chút để chứa Legend (220px -> 260px)
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '260px' }}>
      {/* Tăng height của PieChart lên 260 */}
      <PieChart width={250} height={260}>
        <Pie
          data={data}
          cx={125} 
          cy={100} // Đẩy tâm hình tròn lên cao một chút (110 -> 100) để nhường chỗ cho chữ ở dưới
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
        
        {/* 3. THÊM COMPONENT GHI CHÚ MÀU Ở ĐÂY */}
        <Legend 
          verticalAlign="bottom" // Nằm ở dưới cùng
          align="center"         // Căn giữa
          iconType="circle"      // Icon dạng hình tròn (thay vì hình vuông mặc định)
          wrapperStyle={{ 
            fontSize: '13px', 
            fontWeight: '500',
            paddingTop: '20px'   // Tạo khoảng cách với biểu đồ
          }}
        />
      </PieChart>
    </div>
  );
}