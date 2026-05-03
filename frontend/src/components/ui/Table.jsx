// src/components/ui/Table.jsx
import { useState, useEffect, useMemo } from 'react';
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from './Badge.jsx';

/**
 * Table component dùng chung toàn hệ thống.
 *
 * Props bổ sung:
 *   onRowClick     - callback(row) khi click vào một dòng
 */
export default function Table({
  columns,
  rows,
  renderCell,
  loading = false,
  striped = false,
  hoverable = false,
  emptyMessage = 'Không có dữ liệu',
  pagination = false,
  pageSize = 10,
  totalItems: externalTotalItems,
  showFooter = true,
  onRowClick, // thêm prop này
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalItems = externalTotalItems ?? rows.length;
  const totalPages = pagination ? Math.ceil(totalItems / pageSize) : 1;
  const safePage = Math.min(currentPage, totalPages || 1);

  const displayRows = useMemo(() => {
    if (!pagination) return rows;
    const start = (safePage - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, pagination, safePage, pageSize]);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    if (pagination) setCurrentPage(1);
  }, [totalItems, pagination]);

  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div className="table-empty">{emptyMessage}</div>;
  }

  const startEntry = (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(safePage * pageSize, totalItems);

  return (
    <div className={`table-wrap ${striped ? 'striped' : ''} ${hoverable ? 'hoverable' : ''}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr
              key={row.id || row.code || rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {renderCell ? renderCell(row, col) : row[col.key]}
                </td>
              ))}
              <td className="right"><MoreVertical size={18} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      {showFooter && (
        <div className="table-footer">
          Hiển thị {startEntry} - {endEntry} trong tổng số {totalItems} kết quả
          {pagination && totalPages > 1 && (
            <span className="pager">
              <button
                className="btn ghost"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="page-nums">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`btn ghost ${page === currentPage ? 'active' : ''}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ))}
              </span>
              <button
                className="btn ghost"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function statusBadge(status) {
  const text = String(status || '').toLowerCase();
  const tone = text.includes('fail') || text.includes('lỗi') || text.includes('khóa')
    ? 'red'
    : text.includes('warning') || text.includes('chờ')
    ? 'orange'
    : text.includes('retry')
    ? 'blue'
    : 'green';
  return <Badge tone={tone}>{status}</Badge>;
}