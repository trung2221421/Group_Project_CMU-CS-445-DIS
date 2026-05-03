// src/components/charts/BarChart.jsx
import React from 'react';

export default function BarChart({ data = [], year = 2024 }) {
  // 1. Luôn tạo đủ 12 tháng làm bộ khung (từ 1 đến 12)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  // 2. Lọc dữ liệu API chỉ lấy những tháng thuộc năm đang được chọn
  const filteredData = data.filter(item => {
    const d = new Date(item.month);
    return d.getFullYear() === year;
  });

  // 3. Tìm số tiền lớn nhất của năm đó làm mốc tham chiếu
  const maxTotal = Math.max(...filteredData.map(item => item.total), 0) || 1;

  return (
    <div className="bar-chart flex items-end justify-between h-64 gap-2 pt-10 px-2">
      {months.map((month) => {
        const monthData = filteredData.find(item => {
          const d = new Date(item.month);
          return (d.getMonth() + 1) === month;
        });

        const total = monthData ? monthData.total : 0;
        const heightPercent = total > 0 ? (total / maxTotal) * 100 : 0;

        const yearSuffix = year.toString().slice(-2);
        const label = `T${month.toString().padStart(2, '0')}/${yearSuffix}`;

        // Định dạng số tiền viết tắt (VD: 1.000.000 -> 1 Tr ₫)
        const formattedTotal = total > 0 ? new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND',
            notation: 'compact', // Thêm dòng này để viết tắt số
            maximumFractionDigits: 1 // Chỉ lấy tối đa 1 số thập phân (VD: 1,5 Tr)
        }).format(total) : '';

        return (
          <div className="bar-item flex flex-col items-center flex-1 group h-full justify-end" key={month}>
            
            {/* Đổi w-full thành w-8 hoặc w-10 để cột nhỏ lại và đều nhau */}
            <div className="bar-track w-10 bg-gray-100 rounded-t-md h-full flex flex-col items-center justify-end">

              {/* Cột màu xanh nước hiển thị dữ liệu */}
              <div 
                className="bar-fill w-full bg-sky-500 rounded-t-md transition-all duration-500 group-hover:bg-sky-600 relative flex justify-center" 
                style={{ height: `${heightPercent}%` }}
              >
                {/* Tooltip đen ẩn hiện khi hover */}
                {total > 0 && (
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-gray-800 text-white text-xs rounded px-2 py-1 z-20 shadow-lg whitespace-nowrap">
                    {formattedTotal}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>

            </div>
            
            <span className="mt-2 text-xs text-gray-500 font-medium">{label}</span>
          </div>
        );
      })}
    </div>
  );
}