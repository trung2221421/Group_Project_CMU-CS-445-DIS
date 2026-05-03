import { MoreVertical } from 'lucide-react';
import Badge from './Badge.jsx';

export default function Table({ columns = [], rows = [], renderCell }) {
  // Đảm bảo rows luôn là một mảng
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <div className="table-wrap overflow-x-auto w-full">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((column) => (
              <th 
                key={column.key} 
                className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap"
              >
                {column.label}
              </th>
            ))}
            {/* Cột tĩnh dành cho nút MoreVertical của bạn */}
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {safeRows.length > 0 ? (
            safeRows.map((row, rowIndex) => (
              <tr 
                key={row?.id || row?.EmployeesID || rowIndex} 
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-4 whitespace-nowrap">
                    {renderCell ? renderCell(row, column) : (row[column.key] || '---')}
                  </td>
                ))}
                <td className="px-4 py-4 text-right text-gray-400">
                  <button type="button" className="hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="text-center py-10 text-gray-400 font-medium">
                Không có dữ liệu hiển thị (Hãy kiểm tra lại Database)
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function statusBadge(status) {
  const text = String(status || '').toLowerCase();
  
  let tone = 'green';
  if (text.includes('fail') || text.includes('lỗi') || text.includes('khóa') || text.includes('off')) {
    tone = 'red';
  } else if (text.includes('warning') || text.includes('chờ') || text.includes('pending')) {
    tone = 'orange';
  } else if (text.includes('retry') || text.includes('đang')) {
    tone = 'blue';
  }

  return (
    <Badge tone={tone}>
      <span className="uppercase text-[10px] font-bold">{status || 'N/A'}</span>
    </Badge>
  );
}