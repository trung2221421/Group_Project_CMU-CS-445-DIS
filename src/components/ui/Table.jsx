import { MoreVertical } from 'lucide-react';
import Badge from './Badge.jsx';

export default function Table({ columns, rows, renderCell }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th></th></tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id || row.code || rowIndex}>
              {columns.map((column) => (
                <td key={column.key}>{renderCell ? renderCell(row, column) : row[column.key]}</td>
              ))}
              <td className="right"><MoreVertical size={18} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="table-footer">Hiển thị 1 - {rows.length} trong tổng số 128 kết quả <span className="pager">‹ 1 2 3 ›</span></div>
    </div>
  );
}

export function statusBadge(status) {
  const text = String(status || '').toLowerCase();
  const tone = text.includes('fail') || text.includes('lỗi') || text.includes('khóa') ? 'red' : text.includes('warning') || text.includes('chờ') ? 'orange' : text.includes('retry') ? 'blue' : 'green';
  return <Badge tone={tone}>{status}</Badge>;
}
