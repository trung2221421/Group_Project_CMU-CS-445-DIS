import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCheck,
  Filter,
  RefreshCw,
  Search,
  Bell,
  Clock3,
  MoreVertical,
} from 'lucide-react';

import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Badge from '../components/ui/Badge.jsx';

import {
  getNotifications,
  generateNotifications,
  markAllNotificationsAsRead,
} from '../services/notificationService.js';

const thStyle = {
  padding: '15px 18px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#64748b',
  background: '#f8fafc',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '16px 18px',
  fontSize: 15,
  color: '#0f172a',
  borderBottom: '1px solid #eef2f7',
  verticalAlign: 'middle',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
};

const actionButtonStyle = {
  height: 44,
  borderRadius: 14,
  padding: '0 18px',
  fontWeight: 900,
  border: '1px solid #dbe3ef',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  whiteSpace: 'nowrap',
  fontSize: 15,
};

function levelBadge(level) {
  const value = String(level || 'LOW').toUpperCase();

  const map = {
    HIGH: {
      label: 'Quan trọng',
      bg: '#fee2e2',
      color: '#dc2626',
    },
    MEDIUM: {
      label: 'Trung bình',
      bg: '#fef3c7',
      color: '#b45309',
    },
    LOW: {
      label: 'Thấp',
      bg: '#dcfce7',
      color: '#047857',
    },
    CRITICAL: {
      label: 'Khẩn cấp',
      bg: '#fee2e2',
      color: '#b91c1c',
    },
  };

  const style = map[value] || map.LOW;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 12px',
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: 'nowrap',
      }}
    >
      {style.label}
    </span>
  );
}

function statusBadge(status) {
  const isRead = status === 'Đã đọc';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 12px',
        borderRadius: 999,
        background: isRead ? '#f1f5f9' : '#eff6ff',
        color: isRead ? '#64748b' : '#2563eb',
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

function formatTime(value) {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('vi-VN');
}

export default function Alerts() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [marking, setMarking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [error, setError] = useState('');

  async function loadNotifications() {
    try {
      setLoading(true);
      setError('');

      const data = await getNotifications();

      const normalizedRows = Array.isArray(data)
        ? data.map((item) => ({
            id: item.id,
            level: item.level || 'LOW',
            type: item.type || 'SYSTEM',
            content: item.title || item.content || item.message || 'Không có tiêu đề',
            detail: item.content || item.message || '',
            time: item.time || item.CreatedAt || item.created_at,
            status: item.is_read ? 'Đã đọc' : 'Chưa đọc',
          }))
        : [];

      setRows(normalizedRows);
    } catch (err) {
      console.error('Cannot load notifications', err);
      setError('Không thể tải danh sách thông báo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    try {
      setGenerating(true);
      setError('');
      await generateNotifications();
      await loadNotifications();
    } catch (err) {
      console.error('Cannot generate notifications', err);
      setError('Không thể tạo thông báo mới.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleMarkRead() {
    try {
      setMarking(true);
      setError('');
      await markAllNotificationsAsRead();
      await loadNotifications();
    } catch (err) {
      console.error('Cannot mark notifications as read', err);
      setError('Không thể đánh dấu đã đọc.');
    } finally {
      setMarking(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const highCount = rows.filter((row) => row.level === 'HIGH' || row.level === 'CRITICAL').length;
  const mediumCount = rows.filter((row) => row.level === 'MEDIUM').length;
  const lowCount = rows.filter((row) => row.level === 'LOW').length;
  const unreadCount = rows.filter((row) => row.status === 'Chưa đọc').length;

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return rows.filter((row) => {
      const matchLevel = levelFilter === 'ALL' || row.level === levelFilter;

      const matchSearch =
        !keyword ||
        row.type.toLowerCase().includes(keyword) ||
        row.content.toLowerCase().includes(keyword) ||
        row.detail.toLowerCase().includes(keyword) ||
        row.status.toLowerCase().includes(keyword);

      return matchLevel && matchSearch;
    });
  }, [rows, searchTerm, levelFilter]);

  return (
    <MainLayout
      title="Trung tâm Thông báo"
      subtitle="Quản lý thông báo kỷ niệm làm việc, nghỉ phép và chênh lệch lương."
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <Card
          className="bg-white"
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(260px, 1fr) 200px auto',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <label
              style={{
                height: 44,
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                background: '#f8fafc',
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                minWidth: 0,
              }}
            >
              <Search size={18} color="#64748b" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm theo loại, nội dung, trạng thái..."
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  color: '#0f172a',
                }}
              />
            </label>

            <select
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
              style={{
                height: 44,
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                padding: '0 14px',
                background: '#ffffff',
                fontSize: 14,
                fontWeight: 800,
                color: '#334155',
                outline: 'none',
              }}
            >
              <option value="ALL">Tất cả mức độ</option>
              <option value="HIGH">Quan trọng</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="LOW">Thấp</option>
            </select>

            <div
              style={{
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={loadNotifications}
                disabled={loading}
                style={{
                  ...actionButtonStyle,
                  background: '#ffffff',
                  color: '#334155',
                  opacity: loading ? 0.65 : 1,
                }}
              >
                <Filter size={18} />
                {loading ? 'Đang tải...' : 'Lọc dữ liệu'}
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating}
                style={{
                  ...actionButtonStyle,
                  background: '#ffffff',
                  color: '#334155',
                  opacity: generating ? 0.65 : 1,
                }}
              >
                <RefreshCw size={18} />
                {generating ? 'Đang tạo...' : 'Tạo thông báo'}
              </button>

              <button
                type="button"
                onClick={handleMarkRead}
                disabled={marking}
                style={{
                  ...actionButtonStyle,
                  border: 'none',
                  background: '#4f46e5',
                  color: '#ffffff',
                  boxShadow: '0 10px 20px rgba(79, 70, 229, 0.24)',
                  opacity: marking ? 0.7 : 1,
                }}
              >
                <CheckCheck size={18} />
                {marking ? 'Đang xử lý...' : 'Đánh dấu đã đọc'}
              </button>
            </div>
          </div>
        </Card>

        {error && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#b91c1c',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 800,
            }}
          >
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2.2fr) minmax(280px, 0.8fr)',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          <Card
            className="bg-white"
            style={{
              borderRadius: 24,
              border: '1px solid #e5e7eb',
              borderTop: highCount > 0 ? '6px solid #dc2626' : '6px solid #e5e7eb',
              boxShadow: '0 12px 36px rgba(15, 23, 42, 0.06)',
              padding: 28,
              minHeight: 220,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <Badge tone="red">Quan trọng</Badge>

              <h2
                style={{
                  margin: '14px 0 0',
                  fontSize: 26,
                  fontWeight: 950,
                  color: '#0f172a',
                }}
              >
                Thông báo mức cao
              </h2>

              <p
                style={{
                  margin: '18px 0 0',
                  color: '#64748b',
                  fontSize: 16,
                  fontWeight: 650,
                  lineHeight: 1.6,
                }}
              >
                Hệ thống đang có{' '}
                <strong style={{ color: highCount > 0 ? '#dc2626' : '#0f172a' }}>
                  {highCount}
                </strong>{' '}
                thông báo mức cao cần xử lý.
              </p>
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
              style={{
                marginTop: 24,
                width: '100%',
                height: 48,
                borderRadius: 14,
                border: 'none',
                background: highCount > 0 ? '#dc2626' : '#334155',
                color: '#ffffff',
                fontWeight: 900,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </Card>

          <Card
            className="bg-white"
            style={{
              borderRadius: 24,
              border: '1px solid #3730a3',
              background: 'linear-gradient(135deg, #3730a3 0%, #1e3a8a 100%)',
              color: '#ffffff',
              boxShadow: '0 16px 38px rgba(49, 46, 129, 0.28)',
              padding: 26,
              minHeight: 220,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Bell size={25} />
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 950,
                }}
              >
                Tóm tắt thông báo
              </h2>
            </div>

            <div
              style={{
                marginTop: 18,
                display: 'grid',
                gap: 12,
              }}
            >
              {[
                ['Quan trọng', highCount],
                ['Trung bình', mediumCount],
                ['Thấp', lowCount],
                ['Chưa đọc', unreadCount],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{
                    height: 46,
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    fontWeight: 850,
                  }}
                >
                  <span>{label}</span>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card
          className="bg-white"
          style={{
            borderRadius: 24,
            border: '1px solid #e5e7eb',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '22px 26px',
              borderBottom: '1px solid #eef2f7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 950,
                  color: '#0f172a',
                }}
              >
                Lịch sử thông báo gần đây
              </h2>

              <p
                style={{
                  margin: '6px 0 0',
                  fontSize: 14,
                  color: '#64748b',
                  fontWeight: 650,
                }}
              >
                Hiển thị {filteredRows.length} thông báo phù hợp.
              </p>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: '#64748b',
                fontWeight: 800,
              }}
            >
              <Clock3 size={18} />
              Cập nhật gần nhất
            </div>
          </div>

          <div style={{ width: '100%', overflowX: 'hidden' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '13%' }}>Mức độ</th>
                  <th style={{ ...thStyle, width: '15%' }}>Loại</th>
                  <th style={{ ...thStyle, width: '35%' }}>Nội dung</th>
                  <th style={{ ...thStyle, width: '20%' }}>Thời gian</th>
                  <th style={{ ...thStyle, width: '13%' }}>Trạng thái</th>
                  <th style={{ ...thStyle, width: '4%' }} />
                </tr>
              </thead>

              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{levelBadge(row.level)}</td>

                      <td style={tdStyle}>
                        <strong>{row.type}</strong>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 850, color: '#0f172a' }}>
                          {row.content}
                        </div>
                        {row.detail && (
                          <div
                            style={{
                              marginTop: 5,
                              fontSize: 13,
                              color: '#64748b',
                              lineHeight: 1.45,
                            }}
                          >
                            {row.detail}
                          </div>
                        )}
                      </td>

                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        {formatTime(row.time)}
                      </td>

                      <td style={tdStyle}>{statusBadge(row.status)}</td>

                      <td style={tdStyle}>
                        <button
                          type="button"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: 'none',
                            background: '#f8fafc',
                            color: '#64748b',
                            cursor: 'pointer',
                          }}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: '42px 18px',
                        textAlign: 'center',
                        color: '#94a3b8',
                        fontWeight: 700,
                        fontStyle: 'italic',
                      }}
                    >
                      {loading ? 'Đang tải thông báo...' : 'Không có thông báo phù hợp'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}