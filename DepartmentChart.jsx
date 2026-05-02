import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#f43f5e', '#06b6d4'];

export default function DepartmentChart({ data = [] }) {
  // Biến đổi cấu trúc mảng [name, weight, count] thành dạng object cho Recharts
  const chartData = data.map(([name, weight, count]) => ({
    name: name,
    value: Number(count) || 0,
    weight: weight
  }));

  if (!chartData || chartData.length === 0) {
    return <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">Chưa có dữ liệu</div>;
  }

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            outerRadius={85}
            dataKey="value"
            stroke="white"
            strokeWidth={2}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
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
            verticalAlign="bottom" 
            height={36} 
            iconType="circle" 
            wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}