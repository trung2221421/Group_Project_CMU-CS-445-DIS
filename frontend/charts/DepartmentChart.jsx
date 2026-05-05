import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f43f5e', '#06b6d4', '#eab308', '#6366f1', '#14b8a6'];

export default function DepartmentChart({ data = [] }) {
  // 1. Chống sập trang: Đảm bảo data luôn là mảng
  const safeData = Array.isArray(data) ? data : [];

  // 2. FIX LỖI OBJECT ITERABLE: Lấy trực tiếp item.name và item.value từ Object
  const chartData = safeData.map(item => ({
    name: item.name || 'Chưa phân bổ', 
    value: Number(item.value) || 0
  }));

  // 3. Xử lý khi mảng rỗng
  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">Chưa có dữ liệu</div>;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="35%" /* Đẩy biểu đồ sang trái để nhường không gian bên phải cho Legend */
            cy="50%" /* Đưa cy về 50% (căn giữa dọc) để không bị khuất đỉnh hình */
            outerRadius={85}
            dataKey="value"
            nameKey="name" /* Khai báo rõ key lấy tên phòng ban cho Legend */
            stroke="white"
            strokeWidth={2}
            label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''} /* Ẩn label nếu 0% cho gọn */
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} nhân sự`, 'Số lượng']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend 
            layout="vertical" /* Chuyển ghi chú thành xếp dọc */
            verticalAlign="middle" /* Căn giữa theo chiều dọc */
            align="right" /* Đẩy toàn bộ ghi chú sang bên phải */
            iconType="circle" 
            wrapperStyle={{ 
                fontSize: '12px', 
                right: '10px', /* Tạo khoảng cách lề phải một chút cho đẹp */
                lineHeight: '24px', /* Tăng khoảng cách dòng để dễ đọc hơn */
                width: '45%' /* Set cứng độ rộng để tên phòng ban dài không bị tràn dòng */
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}