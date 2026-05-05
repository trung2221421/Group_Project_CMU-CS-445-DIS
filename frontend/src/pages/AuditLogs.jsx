import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Download,
  Eye,
  Filter,
  History,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';

import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { getAuditLogs, trackAuditActionSafe } from '../services/auditService.js';
import { getRoleName, getStoredAuth, hasPermission } from '../utils/permissions.js';

const ROLE_AUDIT_SCOPE = {
  Admin: 'ALL',
  'HR Manager': 'HR',
  'Payroll Manager': 'PAYROLL',
  Employee: 'NONE',
};

const DEFAULT_ROLE = getStoredAuth().roles?.map(getRoleName).filter(Boolean).join(', ') || 'Authenticated';



const thStyle = {
  padding: '15px 16px',
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
  padding: '16px 16px',
  fontSize: 14,
  color: '#0f172a',
  borderBottom: '1px solid #eef2f7',
  verticalAlign: 'middle',
  wordBreak: 'break-word',
};

const buttonBase = {
  height: 42,
  borderRadius: 13,
  padding: '0 15px',
  fontWeight: 850,
  border: '1px solid #e5e7eb',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  whiteSpace: 'nowrap',
};

const inputStyle = {
  height: 42,
  border: '1px solid #e5e7eb',
  borderRadius: 13,
  padding: '0 13px',
  outline: 'none',
  background: '#ffffff',
  color: '#0f172a',
  fontSize: 14,
  fontWeight: 650,
};

function parseMaybeJson(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeLog(item, index) {
  const targetType = item.target_type ?? item.TargetType ?? item.targetType ?? '';
  const targetId = item.target_id ?? item.TargetID ?? item.targetId ?? '';

  const roleValue =
    item.role ??
    item.roles ??
    item.Role ??
    item.Roles ??
    item.role_name ??
    item.roleName ??
    item.RoleName ??
    item.roles_name ??
    item.RolesName ??
    '--';

  const roleText = Array.isArray(roleValue)
    ? roleValue
        .map((role) => role.RoleName || role.roleName || role.name || role.Name || role)
        .filter(Boolean)
        .join(', ')
    : String(roleValue || '--');

  return {
    id: item.id ?? item.AuditLogID ?? item.LogID ?? index + 1,
    user:
      item.user ??
      item.full_name ??
      item.FullName ??
      item.username ??
      item.Username ??
      item.UserName ??
      item.actor ??
      'system',
    role: roleText || '--',
    action: item.action ?? item.Action ?? 'UNKNOWN_ACTION',
    module: item.module ?? item.Module ?? item.entity ?? item.Entity ?? 'SYSTEM',
    status: item.status ?? item.Status ?? 'SUCCESS',
    detail: item.detail ?? item.Detail ?? item.description ?? item.Description ?? '',
    target_type: targetType,
    target: (item.target ?? item.Target ?? [targetType, targetId].filter(Boolean).join(': ')) || '--',
    old_value: parseMaybeJson(item.old_value ?? item.OldValue ?? item.oldValue ?? null),
    new_value: parseMaybeJson(item.new_value ?? item.NewValue ?? item.newValue ?? null),
    ip_address: item.ip_address ?? item.IPAddress ?? '',
    user_agent: item.user_agent ?? item.UserAgent ?? '',
    time: item.time ?? item.CreatedAt ?? item.created_at ?? item.Timestamp ?? '',
  };
}

function formatTime(value) {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('vi-VN');
}

function moduleBadge(module) {
  const normalized = String(module || 'SYSTEM').toUpperCase();

  const map = {
    HR: {
      bg: '#dcfce7',
      color: '#047857',
      label: 'HR',
    },
    PAYROLL: {
      bg: '#dbeafe',
      color: '#2563eb',
      label: 'Payroll',
    },
    SYNC: {
      bg: '#ede9fe',
      color: '#7c3aed',
      label: 'Sync',
    },
    USER_MANAGEMENT: {
      bg: '#fef3c7',
      color: '#b45309',
      label: 'User',
    },
    SYSTEM: {
      bg: '#f1f5f9',
      color: '#475569',
      label: 'System',
    },
  };

  const style = map[normalized] || map.SYSTEM;

  return (
    <span
      style={{
        display: 'inline-flex',
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
  const normalized = String(status || 'SUCCESS').toUpperCase();
  const style =
    normalized === 'SUCCESS'
      ? { bg: '#dcfce7', color: '#047857', label: 'Thành công' }
      : normalized === 'FAILED'
        ? { bg: '#fee2e2', color: '#b91c1c', label: 'Thất bại' }
        : { bg: '#fef3c7', color: '#b45309', label: 'Cảnh báo' };

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '7px 11px',
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

function actionBadge(action) {
  const text = String(action || 'UNKNOWN_ACTION');

  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '7px 12px',
        borderRadius: 999,
        background: '#f8fafc',
        color: '#334155',
        border: '1px solid #e5e7eb',
        fontSize: 12,
        fontWeight: 900,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function exportAuditCsv(rows) {
  const headers = [
    'ID Log',
    'Người dùng',
    'Vai trò',
    'Hành động',
    'Module',
    'Đối tượng',
    'Mô tả chi tiết',
    'Giá trị cũ',
    'Giá trị mới',
    'Thời gian',
  ];

  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) =>
      [
        row.id,
        row.user,
        row.role,
        row.action,
        row.module,
        row.target,
        row.detail,
        row.old_value ?? '',
        row.new_value ?? '',
        row.time,
      ]
        .map(csvEscape)
        .join(',')
    ),
  ];

  const blob = new Blob(['\ufeff' + lines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();

  URL.revokeObjectURL(link.href);
}

function canViewModule(role, module) {
  const scope = ROLE_AUDIT_SCOPE[role] || 'NONE';
  const normalizedModule = String(module || '').toUpperCase();

  if (scope === 'ALL') return true;
  if (scope === 'HR') return normalizedModule === 'HR';
  if (scope === 'PAYROLL') return normalizedModule === 'PAYROLL';
  return false;
}

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.42)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        style={{
          width: 'min(760px, 100%)',
          background: '#ffffff',
          borderRadius: 24,
          border: '1px solid #e5e7eb',
          boxShadow: '0 30px 80px rgba(15, 23, 42, 0.28)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #eef2f7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 950,
              color: '#0f172a',
            }}
          >
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentRole, setCurrentRole] = useState(DEFAULT_ROLE);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  async function loadLogs() {
    try {
      setLoading(true);
      setError('');

      const data = await getAuditLogs({ limit: 300 });
      const source = Array.isArray(data) ? data : [];

      setRows(source.map(normalizeLog));
    } catch (error) {
      console.error('Cannot load audit logs', error);
      setRows([]);
      setError(error.message || 'Không thể tải log từ backend.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
    trackAuditActionSafe({
      action: 'VIEW_AUDIT_LOGS',
      module: 'AUDIT',
      detail: 'Người dùng mở màn hình Audit Logs',
      targetType: 'PAGE',
      targetId: 'AuditLogs',
      status: 'SUCCESS',
    });
  }, []);

  const roleVisibleRows = rows;

  const modules = useMemo(() => {
    return ['ALL', ...Array.from(new Set(roleVisibleRows.map((row) => row.module)))];
  }, [roleVisibleRows]);

  const actions = useMemo(() => {
    return ['ALL', ...Array.from(new Set(roleVisibleRows.map((row) => row.action)))];
  }, [roleVisibleRows]);

  const filteredRows = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return roleVisibleRows.filter((row) => {
      const matchModule = moduleFilter === 'ALL' || row.module === moduleFilter;
      const matchAction = actionFilter === 'ALL' || row.action === actionFilter;

      const matchSearch =
        !keyword ||
        String(row.id).toLowerCase().includes(keyword) ||
        row.user.toLowerCase().includes(keyword) ||
        row.role.toLowerCase().includes(keyword) ||
        row.action.toLowerCase().includes(keyword) ||
        row.module.toLowerCase().includes(keyword) ||
        row.detail.toLowerCase().includes(keyword) ||
        String(row.target).toLowerCase().includes(keyword);

      return matchModule && matchAction && matchSearch;
    });
  }, [roleVisibleRows, searchTerm, moduleFilter, actionFilter]);

  const syncCount = roleVisibleRows.filter(
    (row) => String(row.module).toUpperCase() === 'SYNC'
  ).length;

  const dataChangeCount = roleVisibleRows.filter((row) =>
    ['UPDATE_EMPLOYEE', 'UPDATE_SALARY', 'UPDATE_ROLE', 'DELETE', 'CREATE'].some((key) =>
      String(row.action).toUpperCase().includes(key)
    )
  ).length;

  const userActionCount = roleVisibleRows.filter(
    (row) => String(row.user).toLowerCase() !== 'system'
  ).length;

  const noPermission = false;
  const canExport = hasPermission('Audit Logs', 'Export') || hasPermission('Audit Logs', 'View');

  return (
    <MainLayout
      title="Nhật ký hệ thống"
      subtitle="Giám sát hoạt động người dùng, thay đổi dữ liệu quan trọng và đồng bộ HR - Payroll."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <Card
          style={{
            padding: 24,
            borderRadius: 24,
            border: '1px solid #e5e7eb',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 18,
                  background: '#eef2ff',
                  color: '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={28} />
              </div>

              <div>
                <h1
                  style={{
                    margin: 0,
                    color: '#0f172a',
                    fontSize: 28,
                    fontWeight: 950,
                  }}
                >
                  Nhật ký hệ thống & Audit Logs
                </h1>
                <p
                  style={{
                    margin: '8px 0 0',
                    color: '#64748b',
                    fontWeight: 650,
                  }}
                >
                  Ghi nhận hành động người dùng, thay đổi dữ liệu quan trọng và log đồng bộ HR - Payroll.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => exportAuditCsv(filteredRows)}
                disabled={!canExport || filteredRows.length === 0}
                style={{
                  ...buttonBase,
                  background: '#ffffff',
                  color: !canExport ? '#94a3b8' : '#334155',
                  cursor: !canExport ? 'not-allowed' : 'pointer',
                }}
              >
                <Download size={17} />
                Xuất báo cáo
              </button>

              <button
                type="button"
                onClick={loadLogs}
                style={{
                  ...buttonBase,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 10px 20px rgba(37, 99, 235, 0.22)',
                }}
              >
                <RefreshCw size={17} />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>
        </Card>

        {error && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              border: '1px solid #fed7aa',
              background: '#fff7ed',
              color: '#c2410c',
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

        {noPermission ? (
          <Card
            style={{
              padding: 32,
              borderRadius: 24,
              border: '1px solid #fecaca',
              background: '#fef2f2',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Shield size={36} color="#dc2626" />

              <div>
                <h2 style={{ margin: 0, color: '#991b1b', fontSize: 24 }}>
                  Bạn không có quyền xem Audit Logs
                </h2>
                <p style={{ margin: '8px 0 0', color: '#7f1d1d', fontWeight: 650 }}>
                  Vai trò Employee không được phép xem nhật ký hệ thống.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                gap: 18,
              }}
            >
              <SummaryCard icon={History} label="Tổng log được xem" value={roleVisibleRows.length} tone="#2563eb" />
              <SummaryCard icon={UserCheck} label="Hành động người dùng" value={userActionCount} tone="#059669" />
              <SummaryCard icon={RefreshCw} label="Log đồng bộ HR - Payroll" value={syncCount} tone="#7c3aed" />
              <SummaryCard icon={AlertTriangle} label="Thay đổi dữ liệu quan trọng" value={dataChangeCount} tone="#e11d48" />
            </div>

            <Card
              style={{
                padding: 20,
                borderRadius: 24,
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(260px, 1fr) 180px 220px auto',
                  gap: 14,
                  alignItems: 'center',
                }}
              >
                <label
                  style={{
                    height: 42,
                    border: '1px solid #e5e7eb',
                    borderRadius: 13,
                    background: '#f8fafc',
                    padding: '0 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Search size={18} color="#64748b" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm kiếm theo người dùng, hành động, module, mô tả..."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: '#0f172a',
                      fontSize: 14,
                    }}
                  />
                </label>

                <select
                  value={moduleFilter}
                  onChange={(event) => setModuleFilter(event.target.value)}
                  style={inputStyle}
                >
                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {module === 'ALL' ? 'Tất cả module' : module}
                    </option>
                  ))}
                </select>

                <select
                  value={actionFilter}
                  onChange={(event) => setActionFilter(event.target.value)}
                  style={inputStyle}
                >
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action === 'ALL' ? 'Tất cả hành động' : action}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setModuleFilter('ALL');
                    setActionFilter('ALL');
                  }}
                  style={{
                    ...buttonBase,
                    background: '#ffffff',
                    color: '#334155',
                  }}
                >
                  <Filter size={17} />
                  Xóa lọc
                </button>
              </div>
            </Card>

            <Card
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
                    Danh sách nhật ký hệ thống
                  </h2>
                  <p
                    style={{
                      margin: '6px 0 0',
                      color: '#64748b',
                      fontWeight: 650,
                    }}
                  >
                    Hiển thị {filteredRows.length} log theo quyền Audit Logs của tài khoản hiện tại ({currentRole}).
                  </p>
                </div>

                <Calendar size={24} color="#64748b" />
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
                      <th style={{ ...thStyle, width: '8%' }}>ID Log</th>
                      <th style={{ ...thStyle, width: '14%' }}>Người dùng</th>
                      <th style={{ ...thStyle, width: '13%' }}>Vai trò</th>
                      <th style={{ ...thStyle, width: '16%' }}>Hành động</th>
                      <th style={{ ...thStyle, width: '12%' }}>Module</th>
                      <th style={{ ...thStyle, width: '20%' }}>Mô tả chi tiết</th>
                      <th style={{ ...thStyle, width: '9%' }}>Trạng thái</th>
                      <th style={{ ...thStyle, width: '11%' }}>Thời gian</th>
                      <th style={{ ...thStyle, width: '4%' }} />
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.length > 0 ? (
                      filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td style={tdStyle}>
                            <strong>#{row.id}</strong>
                          </td>

                          <td style={tdStyle}>
                            <strong>{row.user}</strong>
                          </td>

                          <td style={tdStyle}>{row.role}</td>

                          <td style={tdStyle}>{actionBadge(row.action)}</td>

                          <td style={tdStyle}>{moduleBadge(row.module)}</td>

                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700 }}>{row.detail || '--'}</div>
                            <div style={{ marginTop: 5, color: '#64748b', fontSize: 13 }}>
                              Đối tượng: {row.target}
                            </div>
                          </td>

                          <td style={tdStyle}>{statusBadge(row.status)}</td>

                          <td style={{ ...tdStyle, fontSize: 13 }}>
                            {formatTime(row.time)}
                          </td>

                          <td style={tdStyle}>
                            <button
                              type="button"
                              onClick={() => setSelectedLog(row)}
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 10,
                                border: 'none',
                                background: '#eff6ff',
                                color: '#2563eb',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Xem chi tiết log"
                            >
                              <Eye size={17} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          style={{
                            ...tdStyle,
                            textAlign: 'center',
                            padding: 42,
                            color: '#94a3b8',
                            fontStyle: 'italic',
                          }}
                        >
                          Không có log phù hợp với bộ lọc hiện tại.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card
              style={{
                padding: 24,
                borderRadius: 24,
                border: '1px solid #3730a3',
                background: 'linear-gradient(135deg, #3730a3 0%, #1e3a8a 100%)',
                color: '#ffffff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={28} />
                <div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 950 }}>
                    Bảo mật hệ thống
                  </h2>
                  <p style={{ margin: '8px 0 0', opacity: 0.9, fontWeight: 650 }}>
                    Mọi hành động đồng bộ, tạo cảnh báo, thay đổi dữ liệu quan trọng và phân quyền đều được ghi lại trong bảng audit_logs.
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}

        {selectedLog && (
          <Modal title={`Chi tiết log #${selectedLog.id}`} onClose={() => setSelectedLog(null)}>
            <div style={{ padding: 24, display: 'grid', gap: 14 }}>
              <DetailRow label="Người dùng" value={selectedLog.user} />
              <DetailRow label="Vai trò" value={selectedLog.role} />
              <DetailRow label="Hành động" value={selectedLog.action} />
              <DetailRow label="Module" value={selectedLog.module} />
              <DetailRow label="Đối tượng" value={selectedLog.target} />
              <DetailRow label="Mô tả" value={selectedLog.detail} />
              <DetailRow label="Trạng thái" value={selectedLog.status} />
              <DetailRow label="IP" value={selectedLog.ip_address || '--'} />
              <DetailRow label="Giá trị cũ" value={selectedLog.old_value ?? '--'} />
              <DetailRow label="Giá trị mới" value={selectedLog.new_value ?? '--'} />
              <DetailRow label="Thời gian" value={formatTime(selectedLog.time)} />
            </div>
          </Modal>
        )}
      </div>
    </MainLayout>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <Card
      style={{
        padding: 20,
        borderRadius: 22,
        border: '1px solid #e5e7eb',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 15,
            background: `${tone}15`,
            color: tone,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} />
        </div>

        <div>
          <p
            style={{
              margin: 0,
              color: '#64748b',
              fontSize: 13,
              fontWeight: 850,
            }}
          >
            {label}
          </p>
          <h3 style={{ margin: '5px 0 0', fontSize: 26, fontWeight: 950 }}>
            {value}
          </h3>
        </div>
      </div>
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid #eef2f7',
      }}
    >
      <strong style={{ color: '#64748b' }}>{label}</strong>
      <span style={{ color: '#0f172a', fontWeight: 700, wordBreak: 'break-word' }}>
        {String(value)}
      </span>
    </div>
  );
}