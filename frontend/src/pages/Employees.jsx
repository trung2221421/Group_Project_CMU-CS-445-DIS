// src/pages/employees.jsx
import { Link } from 'react-router-dom';

import {
  Filter, Plus, Search, RefreshCw, AlertCircle, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';

import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import { getEmployees, getFilters } from '../services/employeesService.js';

// ========================
// Custom Hook: useEmployees
// ========================
function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    departments: [],
    roles: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFilter, setCurrentFilter] = useState({ dept: '', role: '' });

  const loadEmployees = useCallback(async (dept = '', role = '') => {
    setLoading(true);
    setError(null);
    setCurrentFilter({ dept, role });
    try {
      const data = await getEmployees(dept, role);
      setEmployees(data);
    } catch (err) {
      const errorMessage = err.message || 'Không thể tải danh sách nhân viên';
      setError(errorMessage);
      console.error('Load employees failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFilters = useCallback(async () => {
    try {
      const filterData = await getFilters();
      setFilters(filterData);
    } catch (err) {
      console.error('Load filters failed:', err);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [employeeData, filterData] = await Promise.all([
        getEmployees(),
        getFilters()
      ]);
      setEmployees(employeeData);
      setFilters(filterData);
      setCurrentFilter({ dept: '', role: '' });
    } catch (err) {
      const errorMessage = err.message || 'Không thể tải dữ liệu ban đầu';
      setError(errorMessage);
      console.error('Initial load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      try {
        const [employeeData, filterData] = await Promise.all([
          getEmployees(),
          getFilters()
        ]);
        if (!cancelled) {
          setEmployees(employeeData);
          setFilters(filterData);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
          console.error('Initial load failed:', err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    init();
    return () => { cancelled = true; };
  }, []);

  return {
    employees,
    filters,
    loading,
    error,
    currentFilter,
    loadEmployees,
    loadInitialData,
    setError
  };
}

// ========================
// Hằng số phân trang
// ========================
const ITEMS_PER_PAGE = 10;

// ========================
// Component chính
// ========================
export default function Employees() {
  const {
    employees,
    filters,
    loading,
    error,
    currentFilter,
    loadEmployees,
    loadInitialData,
  } = useEmployees();

  // Local UI state
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page về 1 khi dữ liệu đầu vào thay đổi (filter, search)
  useEffect(() => {
    setCurrentPage(1);
  }, [employees, searchTerm]);

  // Filter & search
  const handleFilter = useCallback(() => {
    if (selectedDept === currentFilter.dept && selectedRole === currentFilter.role) {
      return;
    }
    loadEmployees(selectedDept, selectedRole);
  }, [selectedDept, selectedRole, currentFilter, loadEmployees]);

  const handleReset = useCallback(() => {
    setSelectedDept('');
    setSelectedRole('');
    setSearchTerm('');
    loadInitialData();
    setCurrentPage(1);
  }, [loadInitialData]);

  // Lọc dữ liệu client‑side (search)
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const s = searchTerm.toLowerCase().trim();
    return employees.filter(emp =>
      emp.name?.toLowerCase().includes(s) ||
      emp.email?.toLowerCase().includes(s) ||
      emp.phone?.toLowerCase().includes(s) ||
      emp.dept?.toLowerCase().includes(s) ||
      emp.role?.toLowerCase().includes(s) ||
      String(emp.id).includes(s)
    );
  }, [employees, searchTerm]);

  // Phân trang
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const currentItems = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = useCallback((page) => {
    const pageNum = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNum);
  }, [totalPages]);

  // Render cell
  const renderEmployeeCell = useCallback((row, column) => {
    switch (column.key) {
      case 'name':
        return (
          <div className="person">
            <div className="avatar" title={row.name}>
              {row.initials || '?'}
            </div>
            <div>
              <b>{row.name}</b>
              <small>ID: {row.id}</small>
            </div>
          </div>
        );
      case 'dept':
        return (
          <div>
            <span>{row.dept || '—'}</span>
            <small>{row.role || '—'}</small>
          </div>
        );
      case 'email':
        return (
          <div>
            <span>{row.email || '—'}</span>
            <small>{row.phone || '—'}</small>
          </div>
        );
      case 'status':
        return (
          <span className={`status-badge ${row.status?.toLowerCase() || 'unknown'}`}>
            {row.status || 'Không xác định'}
          </span>
        );
      default:
        return row[column.key] ?? '—';
    }
  }, []);

  const columns = useMemo(() => [
    { key: 'id', label: 'ID', width: '80px' },
    { key: 'name', label: 'Họ và tên', width: '250px' },
    { key: 'dept', label: 'Phòng ban / Chức vụ', width: '200px' },
    { key: 'email', label: 'Thông tin liên hệ', width: '250px' },
    { key: 'status', label: 'Trạng thái', width: '120px' }
  ], []);

  const isFilterActive = selectedDept || selectedRole;
  const isSearchActive = searchTerm.trim().length > 0;

  // ============ RENDER ============
  return (
    <MainLayout title="Quản lý nhân viên">
      {/* Toolbar */}
      <Card className="toolbar-card">
        {/* Search Input */}
        <label className="input-icon">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, phòng ban..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Tìm kiếm nhân viên"
          />
          {isSearchActive && (
            <button
              className="btn-icon clear-search"
              onClick={() => setSearchTerm('')}
              title="Xóa tìm kiếm"
              type="button"
            >
              ×
            </button>
          )}
        </label>

        {/* Department Filter */}
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          aria-label="Lọc theo phòng ban"
        >
          <option value="">Tất cả phòng ban</option>
          {filters.departments.map((dept) => (
            <option key={dept.id} value={dept.name}>{dept.name}</option>
          ))}
        </select>

        {/* Role Filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          aria-label="Lọc theo chức vụ"
        >
          <option value="">Tất cả chức vụ</option>
          {filters.roles.map((role) => (
            <option key={role.id} value={role.name}>{role.name}</option>
          ))}
        </select>

        {/* Action Buttons */}
        <div className="toolbar-actions">
          <button
            className="btn ghost"
            onClick={handleFilter}
            disabled={loading}
            title={isFilterActive ? 'Áp dụng bộ lọc' : 'Tải lại danh sách'}
          >
            <Filter size={17} />
            <span>Lọc</span>
          </button>

          {isFilterActive && (
            <button
              className="btn ghost"
              onClick={handleReset}
              disabled={loading}
              title="Xóa bộ lọc"
            >
              <RefreshCw size={17} />
              <span>Reset</span>
            </button>
          )}

          <Link className="btn primary" to="/employees/new">
            <Plus size={17} />
            <span>Thêm nhân viên</span>
          </Link>
        </div>
      </Card>

      {/* Main Content */}
      <div className="split employee-split">
        <Card className="table-card">
          {/* Error State */}
          {error && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                className="btn ghost"
                onClick={loadInitialData}
                title="Thử lại"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-overlay">
              <div className="spinner" />
              <p>Đang tải dữ liệu...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && totalItems === 0 && (
            <div className="empty-state">
              {isFilterActive || isSearchActive ? (
                <>
                  <Filter size={48} className="empty-icon" />
                  <h3>Không tìm thấy kết quả</h3>
                  <p>
                    Không có nhân viên nào phù hợp với điều kiện lọc. Nhấn Reset để xem tất cả.
                  </p>
                  <button className="btn ghost" onClick={handleReset}>
                    <RefreshCw size={16} /> Xóa bộ lọc
                  </button>
                </>
              ) : (
                <>
                  <Users size={48} className="empty-icon" />
                  <h3>Chưa có nhân viên nào</h3>
                  <p>Hãy thêm nhân viên đầu tiên vào hệ thống.</p>
                  <Link className="btn primary" to="/employees/new">
                    <Plus size={16} /> Thêm nhân viên mới
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Data Table */}
          {!loading && !error && totalItems > 0 && (
            <>
              <div className="table-info">
                <span>
                  Hiển thị {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} trong tổng số {totalItems} kết quả
                  {isFilterActive && ' (đã lọc)'}
                  {isSearchActive && ' (đã tìm kiếm)'}
                </span>
              </div>

              <Table
                columns={columns}
                rows={currentItems}
                renderCell={renderEmployeeCell}
                loading={loading}
                striped
                hoverable
                emptyMessage="Không có dữ liệu"
              />

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="pager">
                  <button
                    className="btn ghost"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="page-info">
                    Trang {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn ghost"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    title="Trang sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}