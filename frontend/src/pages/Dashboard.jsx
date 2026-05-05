import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Users,
  WalletCards,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Activity,
  PieChart as PieChartIcon,
  TrendingUp,
} from 'lucide-react';

import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import DepartmentChart from '../components/charts/DepartmentChart.jsx';

const thStyle = {
  padding: '15px 24px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#64748b',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '16px 24px',
  fontSize: 15,
  color: '#334155',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

const pageButtonStyle = (disabled = false) => ({
  width: 36,
  height: 36,
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: disabled ? '#f1f5f9' : '#ffffff',
  color: disabled ? '#cbd5e1' : '#475569',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

export default function Dashboard() {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState({
    month: 9,
    year: 2024,
  });

  const [selectedYear, setSelectedYear] = useState(2024);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEmployees: 0,
      fullTimeEmployees: 0,
      totalDepartments: 0,
      totalPositions: 0,
      monthlyPayroll: '0 VND',
      leaveDays: 0,
      workDays: 0,
      absentDays: 0,
      alerts: 0,
    },
    departmentsData: [],
    recentActivities: [],
    payrollRows: [],
    salaryTrend: [],
    loading: true,
    error: null,
  });

  const getValue = (row, field) => {
    if (!row) return '---';

    switch (field) {
      case 'id':
        return row.EmployeesID ?? row.EmployeeID ?? row.id ?? row.ID ?? '---';

      case 'name':
        return row.FullName ?? row.fullName ?? row.name ?? row.Name ?? '---';

      case 'dob':
        return row.DateOfBirth ?? row.dob ?? row.BirthDate ?? row.dateOfBirth ?? '---';

      case 'gender':
        return row.Gender ?? row.gender ?? row.GioiTinh ?? '---';

      case 'salary':
        return row.BaseSalary ?? row.NetSalary ?? row.salary ?? row.base_salary ?? row.luong ?? 0;

      case 'status':
        return row.Status ?? row.status ?? row.trang_thai ?? 'Active';

      default:
        return row[field] ?? '---';
    }
  };

  const normalizeSalaryTrend = (rawTrend = [], year = 2024) => {
    const monthLabels = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;

      return {
        month,
        label: `T${String(month).padStart(2, '0')}/${String(year).slice(-2)}`,
        value: 0,
        amount: 0,
        total: 0,
        payroll: 0,
      };
    });

    if (!Array.isArray(rawTrend)) return monthLabels;

    rawTrend.forEach((item) => {
      const labelText = String(item.label || item.monthLabel || item.MonthLabel || '');
      const matchedMonth = labelText.match(/\d+/)?.[0];

      const month =
        Number(item.month) ||
        Number(item.Month) ||
        Number(item.salaryMonth) ||
        Number(item.SalaryMonth) ||
        Number(matchedMonth);

      const amount =
        Number(item.value) ||
        Number(item.amount) ||
        Number(item.total) ||
        Number(item.totalSalary) ||
        Number(item.TotalSalary) ||
        Number(item.monthlyPayroll) ||
        Number(item.MonthlyPayroll) ||
        Number(item.NetSalary) ||
        0;

      if (month >= 1 && month <= 12) {
        monthLabels[month - 1] = {
          ...monthLabels[month - 1],
          ...item,
          month,
          label: `T${String(month).padStart(2, '0')}/${String(year).slice(-2)}`,
          value: amount,
          amount,
          total: amount,
          payroll: amount,
        };
      }
    });

    return monthLabels;
  };

  const formatDate = (value) => {
    if (!value || value === '---') return '---';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toISOString().slice(0, 10);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardData((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await axios.get('http://localhost:8000/api/v1/dashboard/summary', {
          params: {
            month: selectedDate.month,
            year: selectedDate.year,
          },
        });

        const apiData = response.data?.data || response.data || {};

        const validPayrollRows =
          apiData.payrollRows ||
          apiData.payroll_rows ||
          apiData.employees ||
          apiData.employeeRows ||
          [];

        const normalizedTrend = normalizeSalaryTrend(
          apiData.salaryTrend || apiData.salary_trend || [],
          selectedDate.year
        );

        setDashboardData((prev) => ({
          ...prev,
          ...apiData,
          stats: {
            ...prev.stats,
            ...(apiData.stats || {}),
          },
          departmentsData:
            apiData.departmentsData ||
            apiData.departments_data ||
            apiData.departmentData ||
            [],
          recentActivities:
            apiData.recentActivities ||
            apiData.recent_activities ||
            [],
          payrollRows: Array.isArray(validPayrollRows) ? validPayrollRows : [],
          salaryTrend: normalizedTrend,
          loading: false,
          error: null,
        }));

        setCurrentPage(1);
      } catch (error) {
        console.error('Lỗi tải dữ liệu dashboard:', error);

        setDashboardData((prev) => ({
          ...prev,
          loading: false,
          error: 'Không thể tải dữ liệu dashboard.',
        }));
      }
    };

    fetchDashboardData();
  }, [selectedDate]);

  const {
    stats,
    departmentsData,
    recentActivities,
    payrollRows,
    salaryTrend,
    loading,
    error,
  } = dashboardData;

  const validRows = Array.isArray(payrollRows) ? payrollRows : [];
  const totalPages = Math.max(1, Math.ceil(validRows.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const currentRows = validRows.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  const formattedDeptData = (departmentsData || []).map((item) => {
    if (Array.isArray(item)) {
      return {
        name: item[0] || 'Chưa phân bổ',
        value: Number(item[2] !== undefined ? item[2] : item[1]) || 0,
      };
    }

    const deptName =
      item.name ||
      item.DepartmentName ||
      item.departmentName ||
      item.department_name ||
      item.department ||
      'Chưa phân bổ';

    const deptValue =
      item.value ||
      item.EmployeeCount ||
      item.employeeCount ||
      item.count ||
      item.total ||
      0;

    return {
      name: String(deptName),
      value: Number(deptValue) || 0,
    };
  });

  const handleExportExcel = () => {
    const header = ['ID', 'Họ và tên', 'Ngày sinh', 'Giới tính', 'Lương cơ bản', 'Trạng thái'];

    const csvContent = [
      header.join(','),
      ...validRows.map((row) =>
        [
          `"${getValue(row, 'id')}"`,
          `"${getValue(row, 'name')}"`,
          `"${formatDate(getValue(row, 'dob'))}"`,
          `"${getValue(row, 'gender')}"`,
          `"${getValue(row, 'salary')}"`,
          `"${getValue(row, 'status')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_cao_nhan_su_${selectedDate.month}_${selectedDate.year}.csv`;
    link.click();

    URL.revokeObjectURL(link.href);
  };

  if (loading && validRows.length === 0) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="text-gray-500 font-medium animate-pulse">
            Đang đồng bộ dữ liệu hệ thống...
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Tổng quan Dashboard">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo tổng quan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dữ liệu được cập nhật theo thời gian thực từ Database
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="stats-grid six gap-5 mb-8">
        <StatCard
          icon={Users}
          label="Tổng nhân viên"
          value={stats?.totalEmployees?.toString() || '0'}
        />

        <StatCard
          icon={CheckCircle2}
          label="Chính thức"
          value={stats?.fullTimeEmployees?.toString() || '0'}
        />

        <StatCard
          icon={Building2}
          label="Phòng ban"
          value={stats?.totalDepartments?.toString() || '0'}
          tone="orange"
        />

        <StatCard
          icon={WalletCards}
          label="Tổng lương"
          value={stats?.monthlyPayroll || '0 VND'}
          tone="green"
        />

        <StatCard
          icon={CalendarCheck}
          label="Số chức vụ"
          value={(stats?.totalPositions ?? stats?.positions ?? 0).toString()}
          tone="purple"
        />

        <StatCard
          icon={AlertTriangle}
          label="Cảnh báo"
          value={stats?.alerts?.toString() || '0'}
          tone="red"
          danger
        />
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden mb-8 bg-white">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '24px 28px',
            background: '#ffffff',
            borderBottom: '1px solid #eef2f7',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div
              style={{
                background: '#dbeafe',
                color: '#2563eb',
                padding: 10,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={20} />
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#111827',
                }}
              >
                Chi tiết bảng lương & Nhân sự
              </h2>
              <p
                style={{
                  margin: '10px 0 0',
                  fontSize: 15,
                  color: '#64748b',
                  fontWeight: 500,
                }}
              >
                Danh sách nhân sự đang hoạt động trong kỳ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              marginTop: 2,
              marginRight: 10,
              padding: '11px 18px',
              borderRadius: 12,
              border: 'none',
              background: '#059669',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(5, 150, 105, 0.24)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = '#047857';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = '#059669';
            }}
          >
            <Download size={16} />
            XUẤT FILE
          </button>
        </div>

        <div
          style={{
            width: '100%',
            overflowX: 'auto',
            background: '#ffffff',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: 980,
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
            }}
          >
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={thStyle}>Mã NV</th>
                <th style={thStyle}>Họ và tên</th>
                <th style={thStyle}>Ngày sinh</th>
                <th style={thStyle}>Giới tính</th>
                <th style={thStyle}>Lương cơ bản</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Tác vụ</th>
              </tr>
            </thead>

            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((row, index) => {
                  const id = getValue(row, 'id');
                  const name = getValue(row, 'name');
                  const dob = formatDate(getValue(row, 'dob'));
                  const gender = getValue(row, 'gender');
                  const salary = Number(getValue(row, 'salary'));
                  const status = getValue(row, 'status');

                  return (
                    <tr
                      key={`${id}-${index}`}
                      style={{
                        borderBottom: '1px solid #eef2f7',
                        background: '#ffffff',
                      }}
                    >
                      <td style={{ ...tdStyle, width: '8%' }}>{id}</td>

                      <td
                        style={{
                          ...tdStyle,
                          width: '22%',
                          fontWeight: 700,
                          color: '#111827',
                        }}
                      >
                        {name}
                      </td>

                      <td style={{ ...tdStyle, width: '15%' }}>{dob}</td>

                      <td style={{ ...tdStyle, width: '12%' }}>{gender}</td>

                      <td style={{ ...tdStyle, width: '16%' }}>
                        <span
                          style={{
                            color: '#059669',
                            background: '#ecfdf5',
                            padding: '6px 10px',
                            borderRadius: 8,
                            fontWeight: 700,
                            display: 'inline-block',
                          }}
                        >
                          {!Number.isNaN(salary)
                            ? salary.toLocaleString('vi-VN') + ' đ'
                            : '---'}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, width: '14%' }}>
                        {statusBadge(status)}
                      </td>

                      <td style={{ ...tdStyle, width: '13%' }}>
                        <button
                          type="button"
                          onClick={() => navigate('/employees')}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 12px',
                            borderRadius: 9,
                            border: '1px solid #bfdbfe',
                            background: '#eff6ff',
                            color: '#2563eb',
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <Eye size={14} />
                          Hồ sơ
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      padding: '40px 24px',
                      textAlign: 'center',
                      color: '#94a3b8',
                      fontSize: 14,
                      fontStyle: 'italic',
                    }}
                  >
                    Không có dữ liệu nhân sự trong kỳ này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 28px',
            background: '#f8fafc',
            borderTop: '1px solid #eef2f7',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            Hiển thị{' '}
            <strong style={{ color: '#111827' }}>
              {validRows.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1}
            </strong>
            {' - '}
            <strong style={{ color: '#111827' }}>
              {Math.min(safeCurrentPage * itemsPerPage, validRows.length)}
            </strong>
            {' '}trong tổng số{' '}
            <strong style={{ color: '#111827' }}>{validRows.length}</strong>
            {' '}kết quả
          </span>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <button
              type="button"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              style={pageButtonStyle(safeCurrentPage <= 1)}
            >
              <ChevronLeft size={17} />
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              const active = safeCurrentPage === pageNumber;

              return (
                <button
                  type="button"
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  style={{
                    minWidth: 36,
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 10,
                    border: active ? '1px solid #2563eb' : '1px solid #e5e7eb',
                    background: active ? '#2563eb' : '#ffffff',
                    color: active ? '#ffffff' : '#475569',
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: active ? '0 8px 16px rgba(37, 99, 235, 0.22)' : 'none',
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={safeCurrentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              style={pageButtonStyle(safeCurrentPage >= totalPages)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100 mb-8 p-6 bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-800">
              Biến động quỹ lương
            </h2>
          </div>

          <select
            className="bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 px-4 py-2 rounded-xl outline-none hover:border-gray-300 transition-colors cursor-pointer"
            value={selectedYear}
            onChange={(event) => {
              const newYear = Number(event.target.value);
              setSelectedYear(newYear);
              setSelectedDate((prev) => ({
                ...prev,
                year: newYear,
              }));
            }}
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                Năm {year}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-4 h-[300px] overflow-hidden">
          <BarChart
            data={normalizeSalaryTrend(salaryTrend, selectedYear)}
            year={selectedYear}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 rounded-2xl shadow-sm ring-1 ring-gray-100 border-0 flex flex-col bg-white">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800">Cơ cấu phòng ban</h2>
          </div>

          <div className="flex-1 w-full flex items-center justify-center">
            <DepartmentChart data={formattedDeptData} />
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-sm ring-1 ring-gray-100 border-0 flex flex-col items-center justify-center bg-white">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-800">Tóm tắt điểm danh</h2>
            </div>

            <div className="flex gap-2">
              <select
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1.5 rounded-lg outline-none hover:border-gray-300 transition-colors cursor-pointer"
                value={selectedDate.month}
                onChange={(event) => {
                  const newMonth = Number(event.target.value);

                  setSelectedDate((prev) => ({
                    ...prev,
                    month: newMonth,
                  }));
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                  <option key={month} value={month}>
                    Tháng {month}
                  </option>
                ))}
              </select>

              <select
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1.5 rounded-lg outline-none hover:border-gray-300 transition-colors cursor-pointer"
                value={selectedYear}
                onChange={(event) => {
                  const newYear = Number(event.target.value);

                  setSelectedYear(newYear);
                  setSelectedDate((prev) => ({
                    ...prev,
                    year: newYear,
                  }));
                }}
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    Năm {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <DonutChart
              work={stats?.workDays || 0}
              leave={stats?.leaveDays || 0}
              absent={stats?.absentDays || 0}
            />

            <div className="grid grid-cols-3 gap-4 mt-4 w-full">
              <div className="bg-blue-50/50 p-3 rounded-xl text-center border border-blue-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Tổng ngày công
                </span>
                <p className="text-blue-600 font-black text-lg mt-1">
                  {stats?.workDays || 0}
                </p>
              </div>

              <div className="bg-purple-50/50 p-3 rounded-xl text-center border border-purple-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Nghỉ phép
                </span>
                <p className="text-purple-600 font-black text-lg mt-1">
                  {stats?.leaveDays || 0}
                </p>
              </div>

              <div className="bg-red-50/50 p-3 rounded-xl text-center border border-red-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  Vắng mặt
                </span>
                <p className="text-red-500 font-black text-lg mt-1">
                  {stats?.absentDays || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-2xl shadow-sm ring-1 ring-gray-100 border-0 bg-white">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Nhật ký hệ thống</h2>
          </div>

          <div className="space-y-0">
            {(recentActivities || []).map((text, index) => (
              <div
                className="relative flex gap-4 items-start pb-6 last:pb-0"
                key={`${text}-${index}`}
              >
                {index !== (recentActivities || []).length - 1 && (
                  <div className="absolute top-6 left-[11px] w-[2px] h-full bg-gray-100 -z-10" />
                )}

                <div className="relative z-10 w-6 h-6 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>

                <div className="bg-gray-50/80 hover:bg-gray-100 p-3 rounded-xl flex-1 transition-colors border border-gray-100 text-sm text-gray-700 font-medium leading-relaxed">
                  {text}
                </div>
              </div>
            ))}

            {(!recentActivities || recentActivities.length === 0) && (
              <div className="text-center text-sm text-gray-400 py-4 italic">
                Không có sự kiện mới
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}