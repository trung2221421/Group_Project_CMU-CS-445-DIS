import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';

const API_BASE = 'http://127.0.0.1:8000/api';

const emptyDepartmentForm = {
  id: null,
  name: '',
};

const emptyPositionForm = {
  id: null,
  title: '',
  description: '',
  department_id: '',
};

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

function statusBadge(status = 'Synced') {
  const normalized = String(status || '').toLowerCase();

  const styles = normalized.includes('sync')
    ? {
      background: '#dcfce7',
      color: '#047857',
    }
    : normalized.includes('pending')
      ? {
        background: '#fef3c7',
        color: '#b45309',
      }
      : {
        background: '#f1f5f9',
        color: '#475569',
      };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '7px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 900,
        ...styles,
      }}
    >
      {status || 'Synced'}
    </span>
  );
}

function buildDepartmentCode(id) {
  const value = Number(id || 0);
  return `DEP${String(value).padStart(3, '0')}`;
}

function normalizeDepartment(row) {
  const id = row.id ?? row.DepartmentID;

  return {
    id,
    code: row.code || buildDepartmentCode(id),
    name: row.name || row.DepartmentName || '',
    status: row.status || 'Synced',
    employee_count: row.employee_count ?? row.EmployeeCount ?? row.count ?? 0,
    synced_at: row.synced_at || row.UpdatedAt || row.CreatedAt || null,
  };
}

function normalizePosition(row) {
  return {
    id: row.id ?? row.PositionID,
    title: row.title || row.PositionName || '',
    description: row.description || row.Description || '',
    department_id: row.department_id ?? row.DepartmentID ?? '',
    department_name: row.department_name || row.DepartmentName || '',
    synced_at: row.synced_at || row.UpdatedAt || row.CreatedAt || null,
  };
}

function formatDate(value) {
  if (!value) return '--';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleString('vi-VN');
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = 'Có lỗi xảy ra khi gọi API.';

    try {
      const body = await response.json();
      detail = body.detail || body.message || detail;
    } catch {
      detail = await response.text();
    }

    throw new Error(detail);
  }

  if (response.status === 204) return null;

  return response.json();
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
          width: 'min(560px, 100%)',
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

export default function Departments() {
  const [activeTab, setActiveTab] = useState('departments');

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [departmentModalOpen, setDepartmentModalOpen] = useState(false);
  const [positionModalOpen, setPositionModalOpen] = useState(false);

  const [departmentForm, setDepartmentForm] = useState(emptyDepartmentForm);
  const [positionForm, setPositionForm] = useState(emptyPositionForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [departmentResult, positionResult] = await Promise.allSettled([
        requestJson(`${API_BASE}/departments/`),
        requestJson(`${API_BASE}/positions/`),
      ]);

      if (departmentResult.status === 'fulfilled') {
        const departmentRows = departmentResult.value;
        setDepartments(Array.isArray(departmentRows) ? departmentRows.map(normalizeDepartment) : []);
      } else {
        setDepartments([]);
        setError(departmentResult.reason?.message || 'Không thể tải dữ liệu phòng ban.');
      }

      if (positionResult.status === 'fulfilled') {
        const positionRows = positionResult.value;
        setPositions(Array.isArray(positionRows) ? positionRows.map(normalizePosition) : []);
      } else {
        setPositions([]);
        setError(positionResult.reason?.message || 'Không thể tải dữ liệu chức vụ.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => setSuccess(''), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  const filteredDepartments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return departments;

    return departments.filter((item) => {
      return (
        String(item.id).includes(keyword) ||
        item.code.toLowerCase().includes(keyword) ||
        item.name.toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword)
      );
    });
  }, [departments, searchTerm]);

  const filteredPositions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return positions;

    return positions.filter((item) => {
      return (
        String(item.id).includes(keyword) ||
        item.title.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword) ||
        item.department_name.toLowerCase().includes(keyword)
      );
    });
  }, [positions, searchTerm]);

  const totalEmployees = departments.reduce(
    (sum, item) => sum + Number(item.employee_count || 0),
    0
  );

  const openCreateDepartment = () => {
    setDepartmentForm(emptyDepartmentForm);
    setDepartmentModalOpen(true);
  };

  const openEditDepartment = (department) => {
    setDepartmentForm({
      id: department.id,
      name: department.name,
    });
    setDepartmentModalOpen(true);
  };

  const openCreatePosition = () => {
    setPositionForm(emptyPositionForm);
    setPositionModalOpen(true);
  };

  const openEditPosition = (position) => {
    setPositionForm({
      id: position.id,
      title: position.title,
      description: position.description || '',
      department_id: position.department_id || '',
    });
    setPositionModalOpen(true);
  };

  const handleSaveDepartment = async (event) => {
    event.preventDefault();

    const name = departmentForm.name.trim();

    if (!name) {
      setError('Vui lòng nhập tên phòng ban.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (departmentForm.id) {
        await requestJson(`${API_BASE}/departments/${departmentForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
          }),
        });

        setSuccess('Cập nhật phòng ban thành công.');
      } else {
        const nextId =
          departments.length > 0
            ? Math.max(...departments.map((item) => Number(item.id || 0))) + 1
            : 1;

        await requestJson(`${API_BASE}/departments/`, {
          method: 'POST',
          body: JSON.stringify({
            code: buildDepartmentCode(nextId),
            name,
            status: 'Synced',
          }),
        });

        setSuccess('Thêm phòng ban thành công và đã đồng bộ sang Payroll.');
      }

      setDepartmentModalOpen(false);
      setDepartmentForm(emptyDepartmentForm);

      try {
        await loadData();
      } catch {
        // Không làm hỏng thao tác thêm mới chỉ vì reload dữ liệu bị lỗi.
      }
      } catch (err) {
      setError(err.message || 'Không thể lưu phòng ban.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (department) => {
    const accepted = window.confirm(
      `Bạn có chắc muốn xóa phòng ban "${department.name}" không?\n\nLưu ý: Không thể xóa nếu phòng ban còn nhân viên.`
    );

    if (!accepted) return;

    setLoading(true);
    setError('');

    try {
      await requestJson(`${API_BASE}/departments/${department.id}`, {
        method: 'DELETE',
      });

      setSuccess('Xóa phòng ban thành công.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể xóa phòng ban.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePosition = async (event) => {
    event.preventDefault();

    const title = positionForm.title.trim();

    if (!title) {
      setError('Vui lòng nhập tên chức vụ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        description: positionForm.description.trim() || null,
        department_id: positionForm.department_id
          ? Number(positionForm.department_id)
          : null,
      };

      if (positionForm.id) {
        await requestJson(`${API_BASE}/positions/${positionForm.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        setSuccess('Cập nhật chức vụ thành công.');
      } else {
        await requestJson(`${API_BASE}/positions/`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSuccess('Thêm chức vụ thành công và đã đồng bộ sang Payroll.');
      }

      setPositionModalOpen(false);
      setPositionForm(emptyPositionForm);
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể lưu chức vụ.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async (position) => {
    const accepted = window.confirm(
      `Bạn có chắc muốn xóa chức vụ "${position.title}" không?\n\nLưu ý: Không thể xóa nếu còn nhân viên đang đảm nhận.`
    );

    if (!accepted) return;

    setLoading(true);
    setError('');

    try {
      await requestJson(`${API_BASE}/positions/${position.id}`, {
        method: 'DELETE',
      });

      setSuccess('Xóa chức vụ thành công.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể xóa chức vụ.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setError('');

    try {
      const tasks = [
        ...departments.map((department) =>
          requestJson(`${API_BASE}/departments/${department.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              name: department.name,
            }),
          })
        ),
        ...positions.map((position) =>
          requestJson(`${API_BASE}/positions/${position.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              title: position.title,
              description: position.description || null,
              department_id: position.department_id || null,
            }),
          })
        ),
      ];

      await Promise.all(tasks);
      setSuccess('Đồng bộ tất cả phòng ban và chức vụ sang Payroll thành công.');
      await loadData();
    } catch (err) {
      setError(err.message || 'Đồng bộ thất bại.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <MainLayout title="Quản lý Cấu trúc Tổ chức">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 20,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
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
                <Building2 size={27} />
              </div>

              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 950,
                    color: '#0f172a',
                  }}
                >
                  Quản lý Cấu trúc Tổ chức
                </h1>

                <p
                  style={{
                    margin: '8px 0 0',
                    color: '#64748b',
                    fontSize: 15,
                    fontWeight: 650,
                  }}
                >
                  Quản lý phòng ban, chức vụ và đồng bộ dữ liệu sang Payroll.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={activeTab === 'departments' ? openCreateDepartment : openCreatePosition}
                style={{
                  ...buttonBase,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  boxShadow: '0 10px 20px rgba(37, 99, 235, 0.22)',
                }}
              >
                <Plus size={17} />
                {activeTab === 'departments' ? 'Thêm phòng ban' : 'Thêm chức vụ'}
              </button>

              <button
                type="button"
                onClick={handleSyncAll}
                disabled={syncing || loading}
                style={{
                  ...buttonBase,
                  background: '#ffffff',
                  color: '#334155',
                  cursor: syncing || loading ? 'not-allowed' : 'pointer',
                  opacity: syncing || loading ? 0.65 : 1,
                }}
              >
                <RefreshCcw size={17} />
                {syncing ? 'Đang đồng bộ...' : 'Đồng bộ tất cả'}
              </button>
            </div>
          </div>
        </Card>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 18,
          }}
        >
          <Card style={{ padding: 20, borderRadius: 22, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Building2 color="#2563eb" />
              <div>
                <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                  Tổng phòng ban
                </p>
                <h2 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 950 }}>
                  {departments.length}
                </h2>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 20, borderRadius: 22, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Briefcase color="#7c3aed" />
              <div>
                <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                  Tổng chức vụ
                </p>
                <h2 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 950 }}>
                  {positions.length}
                </h2>
              </div>
            </div>
          </Card>

          <Card style={{ padding: 20, borderRadius: 22, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Users color="#059669" />
              <div>
                <p style={{ margin: 0, color: '#64748b', fontWeight: 800 }}>
                  Nhân viên theo phòng ban
                </p>
                <h2 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 950 }}>
                  {totalEmployees}
                </h2>
              </div>
            </div>
          </Card>
        </div>

        {(error || success) && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 16,
              border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`,
              background: error ? '#fef2f2' : '#f0fdf4',
              color: error ? '#b91c1c' : '#047857',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontWeight: 800,
            }}
          >
            {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {error || success}
          </div>
        )}

        <Card
          className="bg-white"
          style={{
            borderRadius: 26,
            border: '1px solid #e5e7eb',
            boxShadow: '0 12px 36px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: 22,
              borderBottom: '1px solid #eef2f7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                padding: 5,
                borderRadius: 15,
                background: '#f1f5f9',
                gap: 4,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('departments')}
                style={{
                  ...buttonBase,
                  height: 38,
                  border: 'none',
                  background: activeTab === 'departments' ? '#ffffff' : 'transparent',
                  color: activeTab === 'departments' ? '#2563eb' : '#64748b',
                  boxShadow:
                    activeTab === 'departments'
                      ? '0 8px 18px rgba(15, 23, 42, 0.08)'
                      : 'none',
                }}
              >
                <Building2 size={16} />
                Phòng ban
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('positions')}
                style={{
                  ...buttonBase,
                  height: 38,
                  border: 'none',
                  background: activeTab === 'positions' ? '#ffffff' : 'transparent',
                  color: activeTab === 'positions' ? '#2563eb' : '#64748b',
                  boxShadow:
                    activeTab === 'positions'
                      ? '0 8px 18px rgba(15, 23, 42, 0.08)'
                      : 'none',
                }}
              >
                <Briefcase size={16} />
                Chức vụ
              </button>
            </div>

            <label
              style={{
                height: 42,
                minWidth: 320,
                border: '1px solid #e5e7eb',
                borderRadius: 14,
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
                placeholder={
                  activeTab === 'departments'
                    ? 'Tìm phòng ban...'
                    : 'Tìm chức vụ...'
                }
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  flex: 1,
                  fontSize: 14,
                  color: '#0f172a',
                }}
              />
            </label>
          </div>

          <div style={{ width: '100%', overflowX: 'hidden' }}>
            {activeTab === 'departments' ? (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '14%' }}>Mã phòng ban</th>
                    <th style={{ ...thStyle, width: '32%' }}>Tên phòng ban</th>
                    <th style={{ ...thStyle, width: '18%' }}>Trạng thái</th>
                    <th style={{ ...thStyle, width: '18%' }}>Số nhân viên</th>
                    <th style={{ ...thStyle, width: '18%' }}>Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDepartments.length > 0 ? (
                    filteredDepartments.map((department) => (
                      <tr key={department.id}>
                        <td style={tdStyle}>
                          <strong style={{ color: '#2563eb' }}>
                            {department.code}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>{department.name}</strong>
                          <div
                            style={{
                              marginTop: 4,
                              color: '#64748b',
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            Cập nhật: {formatDate(department.synced_at)}
                          </div>
                        </td>

                        <td style={tdStyle}>{statusBadge(department.status)}</td>

                        <td style={tdStyle}>
                          <strong>{department.employee_count || 0}</strong> nhân viên
                        </td>

                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => openEditDepartment(department)}
                              style={{
                                ...buttonBase,
                                height: 36,
                                padding: '0 11px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                borderColor: '#bfdbfe',
                              }}
                            >
                              <Edit3 size={15} />
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteDepartment(department)}
                              style={{
                                ...buttonBase,
                                height: 36,
                                padding: '0 11px',
                                background: '#fff1f2',
                                color: '#e11d48',
                                borderColor: '#fecdd3',
                              }}
                            >
                              <Trash2 size={15} />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          ...tdStyle,
                          textAlign: 'center',
                          padding: 40,
                          color: '#94a3b8',
                          fontStyle: 'italic',
                        }}
                      >
                        {loading ? 'Đang tải dữ liệu...' : 'Không có phòng ban phù hợp'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  tableLayout: 'fixed',
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '12%' }}>Mã chức vụ</th>
                    <th style={{ ...thStyle, width: '30%' }}>Tên chức vụ</th>
                    <th style={{ ...thStyle, width: '28%' }}>Mô tả</th>
                    <th style={{ ...thStyle, width: '14%' }}>Đồng bộ</th>
                    <th style={{ ...thStyle, width: '16%' }}>Tác vụ</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPositions.length > 0 ? (
                    filteredPositions.map((position) => (
                      <tr key={position.id}>
                        <td style={tdStyle}>
                          <strong style={{ color: '#7c3aed' }}>
                            POS{String(position.id).padStart(3, '0')}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>{position.title}</strong>
                          <div
                            style={{
                              marginTop: 4,
                              color: '#64748b',
                              fontSize: 13,
                              fontWeight: 600,
                            }}
                          >
                            ID: {position.id}
                          </div>
                        </td>

                        <td style={tdStyle}>
                          {position.description || 'Không có mô tả'}
                        </td>

                        <td style={tdStyle}>{statusBadge('Synced')}</td>

                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => openEditPosition(position)}
                              style={{
                                ...buttonBase,
                                height: 36,
                                padding: '0 11px',
                                background: '#eff6ff',
                                color: '#2563eb',
                                borderColor: '#bfdbfe',
                              }}
                            >
                              <Edit3 size={15} />
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePosition(position)}
                              style={{
                                ...buttonBase,
                                height: 36,
                                padding: '0 11px',
                                background: '#fff1f2',
                                color: '#e11d48',
                                borderColor: '#fecdd3',
                              }}
                            >
                              <Trash2 size={15} />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          ...tdStyle,
                          textAlign: 'center',
                          padding: 40,
                          color: '#94a3b8',
                          fontStyle: 'italic',
                        }}
                      >
                        {loading ? 'Đang tải dữ liệu...' : 'Không có chức vụ phù hợp'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div
            style={{
              padding: '16px 22px',
              background: '#f8fafc',
              borderTop: '1px solid #eef2f7',
              color: '#64748b',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <AlertCircle size={17} />
            Không thể xóa phòng ban hoặc chức vụ nếu vẫn còn nhân viên hoặc bản ghi
            lương liên quan.
          </div>
        </Card>
      </div>

      {departmentModalOpen && (
        <Modal
          title={departmentForm.id ? 'Cập nhật phòng ban' : 'Thêm phòng ban'}
          onClose={() => setDepartmentModalOpen(false)}
        >
          <form onSubmit={handleSaveDepartment}>
            <div style={{ padding: 24 }}>
              <label style={{ display: 'block', fontWeight: 850, marginBottom: 8 }}>
                Tên phòng ban
              </label>
              <input
                value={departmentForm.name}
                onChange={(event) =>
                  setDepartmentForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Ví dụ: Phòng Nhân sự"
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 14,
                  border: '1px solid #e5e7eb',
                  padding: '0 14px',
                  outline: 'none',
                  fontSize: 15,
                  fontWeight: 650,
                }}
              />
            </div>

            <div
              style={{
                padding: '18px 24px',
                borderTop: '1px solid #eef2f7',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setDepartmentModalOpen(false)}
                style={{ ...buttonBase, background: '#ffffff', color: '#334155' }}
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonBase,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {departmentForm.id ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {positionModalOpen && (
        <Modal
          title={positionForm.id ? 'Cập nhật chức vụ' : 'Thêm chức vụ'}
          onClose={() => setPositionModalOpen(false)}
        >
          <form onSubmit={handleSavePosition}>
            <div style={{ padding: 24, display: 'grid', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 850, marginBottom: 8 }}>
                  Tên chức vụ
                </label>
                <input
                  value={positionForm.title}
                  onChange={(event) =>
                    setPositionForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: Nhân viên, Trưởng phòng..."
                  style={{
                    width: '100%',
                    height: 46,
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    padding: '0 14px',
                    outline: 'none',
                    fontSize: 15,
                    fontWeight: 650,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 850, marginBottom: 8 }}>
                  Mô tả
                </label>
                <textarea
                  value={positionForm.description}
                  onChange={(event) =>
                    setPositionForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Mô tả ngắn về chức vụ"
                  rows={3}
                  style={{
                    width: '100%',
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    padding: 14,
                    outline: 'none',
                    fontSize: 15,
                    fontWeight: 650,
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 850, marginBottom: 8 }}>
                  Phòng ban liên quan
                </label>
                <select
                  value={positionForm.department_id}
                  onChange={(event) =>
                    setPositionForm((prev) => ({
                      ...prev,
                      department_id: event.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    height: 46,
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    padding: '0 14px',
                    outline: 'none',
                    fontSize: 15,
                    fontWeight: 650,
                    background: '#ffffff',
                  }}
                >
                  <option value="">Không gán phòng ban</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>

                <p
                  style={{
                    margin: '8px 0 0',
                    color: '#94a3b8',
                    fontSize: 13,
                    fontWeight: 650,
                  }}
                >
                  HUMAN_2025 hiện dùng chức vụ toàn cục, nên trường này chỉ phục vụ
                  giao diện và payload tương thích.
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '18px 24px',
                borderTop: '1px solid #eef2f7',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setPositionModalOpen(false)}
                style={{ ...buttonBase, background: '#ffffff', color: '#334155' }}
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...buttonBase,
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {positionForm.id ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </MainLayout>
  );
}