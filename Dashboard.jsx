import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, Building2, CalendarCheck, CheckCircle2, 
  Users, WalletCards, Download, ChevronLeft, ChevronRight, 
  Eye, CalendarDays, Activity, PieChart as PieChartIcon, TrendingUp 
} from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
// Thêm import cho biểu đồ phòng ban mới
import DepartmentChart from '../components/charts/DepartmentChart.jsx'; 

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState({ month: 9, year: 2024 });
  const [selectedYear, setSelectedYear] = useState(2024);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [dashboardData, setDashboardData] = useState({
    stats: { totalEmployees: 0, fullTimeEmployees: 0, totalDepartments: 0, monthlyPayroll: '0 VND', leaveDays: 0, workDays: 0, absentDays: 0, alerts: 0 },
    departmentsData: [],
    recentActivities: [],
    payrollRows: [],
    salaryTrend: [], 
    loading: true
  });

  const getValue = (row, field) => {
    if (!row) return '---';
    switch (field) {
      case 'id': return row.EmployeesID ?? row.EmployeeID ?? row.id ?? row.ID ?? '---';
      case 'name': return row.FullName ?? row.fullName ?? row.name ?? row.Name ?? '---';
      case 'dob': return row.DateOfBirth ?? row.dob ?? row.BirthDate ?? '---';
      case 'gender': return row.Gender ?? row.gender ?? row.GioiTinh ?? '---';
      case 'dept': return row.DepartmentName ?? row.dept_name ?? row.department ?? row.phong_ban ?? '---';
      case 'pos': return row.PositionName ?? row.position ?? row.chuc_vu ?? '---';
      case 'salary': return row.BaseSalary ?? row.salary ?? row.base_salary ?? row.luong ?? 0;
      case 'status': return row.Status ?? row.status ?? row.trang_thai ?? 'Active';
      default: return row[field] ?? '---';
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setDashboardData(prev => ({ ...prev, loading: true }));
      try {
        const response = await axios.get('http://localhost:8000/api/v1/dashboard/summary', {
          params: { month: selectedDate.month, year: selectedDate.year }
        });
        
        const apiData = response.data?.data || response.data;
        const validPayrollRows = apiData.payrollRows || apiData.payroll_rows || apiData.employees || [];
        
        setDashboardData(prev => ({ 
          ...prev, 
          ...apiData, 
          payrollRows: validPayrollRows, 
          loading: false 
        }));
        setCurrentPage(1);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchDashboardData();
  }, [selectedDate]);

  const { stats, departmentsData, recentActivities, payrollRows, salaryTrend } = dashboardData;

  const validRows = Array.isArray(payrollRows) ? payrollRows : [];
  const totalPages = Math.max(1, Math.ceil(validRows.length / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const currentRows = validRows.slice((safeCurrentPage - 1) * itemsPerPage, safeCurrentPage * itemsPerPage);

  const handleExportExcel = () => {
    const header = ["ID", "Họ và tên", "Ngày sinh", "Giới tính", "Phòng ban", "Vị trí", "Lương cơ bản", "Trạng thái"];
    const csvContent = [
      header.join(","),
      ...validRows.map(r => [
        `"${getValue(r, 'id')}"`,
        `"${getValue(r, 'name')}"`,
        `"${getValue(r, 'dob')}"`,
        `"${getValue(r, 'gender')}"`,
        `"${getValue(r, 'dept')}"`,
        `"${getValue(r, 'pos')}"`,
        `"${getValue(r, 'salary')}"`,
        `"${getValue(r, 'status')}"`
      ].join(","))
    ].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bao_cao_nhan_su_${selectedDate.month}_${selectedDate.year}.csv`;
    link.click();
  };

  if (dashboardData.loading && validRows.length === 0) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="text-gray-500 font-medium animate-pulse">Đang đồng bộ dữ liệu hệ thống...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Tổng quan Dashboard">
      {/* THANH CÔNG CỤ TOP */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Báo cáo tổng quan</h1>
          <p className="text-sm text-gray-500 mt-1">Dữ liệu được cập nhật theo thời gian thực từ Database</p>
        </div>
      </div>

      {/* GRID THỐNG KÊ */}
      <div className="stats-grid six gap-5 mb-8">
        <StatCard icon={Users} label="Tổng nhân viên" value={stats?.totalEmployees?.toString() || '0'} />
        <StatCard icon={CheckCircle2} label="Chính thức" value={stats?.fullTimeEmployees?.toString() || '0'} />
        <StatCard icon={Building2} label="Phòng ban" value={stats?.totalDepartments?.toString() || '0'} tone="orange" />
        <StatCard icon={WalletCards} label="Tổng lương" value={stats?.monthlyPayroll || '0 VND'} tone="green" />
        <StatCard icon={CalendarCheck} label="Số vị trí" value={stats?.totalDepartments?.toString() || '0'} tone="purple" />
        <StatCard icon={AlertTriangle} label="Cảnh báo" value={stats?.alerts?.toString() || '0'} tone="red" danger />
      </div>

      {/* BẢNG DỮ LIỆU */}
      <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-center p-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 w-full sm:w-auto mb-4 sm:mb-0">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Chi tiết bảng lương & Nhân sự</h2>
              <p className="text-xs text-gray-500">Danh sách nhân sự đang hoạt động trong kỳ</p>
            </div>
          </div>
          
          {/* CĂN PHẢI NÚT XUẤT FILE */}
          <div className="flex w-full sm:w-auto justify-end">
            <button 
              onClick={handleExportExcel} 
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <Download size={16} /> XUẤT FILE 
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[380px] bg-white">
          <Table 
            columns={[
              { key: 'id', label: 'Mã NV' },
              { key: 'name', label: 'Họ và tên' },
              { key: 'dob', label: 'Ngày sinh' },
              { key: 'gender', label: 'Giới tính' },
              { key: 'salary', label: 'Lương cơ bản' },
              { key: 'status', label: 'Trạng thái' },
              { key: 'action', label: 'Tác vụ' }
            ]} 
            rows={currentRows} 
            renderCell={(r, c) => {
              const value = getValue(r, c.key);
              if (c.key === 'status') return statusBadge(value);
              if (c.key === 'salary') {
                  const numValue = Number(value);
                  return <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{!isNaN(numValue) ? numValue.toLocaleString('vi-VN') + ' đ' : '---'}</span>;
              }
              if (c.key === 'action') return (
                <button type="button" onClick={() => navigate('/employees')} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold text-xs uppercase bg-blue-50 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100">
                  <Eye size={14} /> Hồ sơ
                </button>
              );
              if (c.key === 'name') return <span className="font-semibold text-gray-800">{value}</span>;
              return <span className="text-gray-600 font-medium">{value}</span>;
            }} 
          />
        </div>

        {/* CĂN PHẢI CÁC NÚT PHÂN TRANG (Dùng justify-end và sm:justify-between) */}
        <div className="flex items-center justify-end sm:justify-between px-6 py-4 bg-gray-50 border-t border-gray-100">
          <span className="text-sm font-medium text-gray-500 hidden sm:block">
            Hiển thị <span className="font-bold text-gray-800">{safeCurrentPage}</span> trên <span className="font-bold text-gray-800">{totalPages}</span> trang
          </span>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <button type="button" disabled={safeCurrentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 transition-all">
              <ChevronLeft size={18}/>
            </button>
            <div className="flex px-1 gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  type="button" 
                  key={i+1} 
                  onClick={() => setCurrentPage(i+1)} 
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-bold transition-all ${safeCurrentPage === i + 1 ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
                >
                  {i+1}
                </button>
              ))}
            </div>
            <button type="button" disabled={safeCurrentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 transition-all">
              <ChevronRight size={18}/>
            </button>
          </div>
        </div>
      </Card>

      <Card className="rounded-2xl shadow-sm border-0 ring-1 ring-gray-100 mb-8 p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-800">Biến động quỹ lương</h2>
          </div>
          <select 
            className="bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700 px-4 py-2 rounded-xl outline-none hover:border-gray-300 transition-colors cursor-pointer" 
            value={selectedYear} 
            onChange={(e) => {
              const newYear = Number(e.target.value);
              setSelectedYear(newYear);
              setSelectedDate(prev => ({ ...prev, year: newYear }));
            }}
          >
              {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
        </div>
        <div className="pt-2">
          <BarChart data={salaryTrend} year={selectedYear} />
        </div>
      </Card>

      {/* 3 KHỐI BÊN DƯỚI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CƠ CẤU PHÒNG BAN - ĐÃ ĐƯỢC CHUYỂN THÀNH BIỂU ĐỒ TRÒN */}
        <Card className="p-6 rounded-2xl shadow-sm ring-1 ring-gray-100 border-0 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <PieChartIcon size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-gray-800">Cơ cấu phòng ban</h2>
          </div>
          <div className="flex-1 w-full flex items-center justify-center">
             <DepartmentChart data={departmentsData} />
          </div>
        </Card>

        {/* ĐIỂM DANH */}
        <Card className="p-6 rounded-2xl shadow-sm ring-1 ring-gray-100 border-0 flex flex-col items-center justify-center">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-800">Tóm tắt điểm danh</h2>
            </div>
            
            {/* BỘ CHỌN THÁNG / NĂM (Dạng Select dropdown) */}
            <div className="flex gap-2">
              <select 
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1.5 rounded-lg outline-none hover:border-gray-300 transition-colors cursor-pointer" 
                value={selectedDate.month} 
                onChange={(e) => {
                  const newMonth = Number(e.target.value);
                  setSelectedDate(prev => ({ ...prev, month: newMonth }));
                }}
              >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => <option key={m} value={m}>Tháng {m}</option>)}
              </select>

              <select 
                className="bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 px-2 py-1.5 rounded-lg outline-none hover:border-gray-300 transition-colors cursor-pointer" 
                value={selectedYear} 
                onChange={(e) => {
                  const newYear = Number(e.target.value);
                  setSelectedYear(newYear);
                  setSelectedDate(prev => ({ ...prev, year: newYear }));
                }}
              >
                  {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>Năm {y}</option>)}
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
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ngày công</span>
                <p className="text-blue-600 font-black text-lg mt-1">{stats?.workDays || 0}</p>
              </div>
              <div className="bg-purple-50/50 p-3 rounded-xl text-center border border-purple-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nghỉ phép</span>
                <p className="text-purple-600 font-black text-lg mt-1">{stats?.leaveDays || 0}</p>
              </div>
              <div className="bg-red-50/50 p-3 rounded-xl text-center border border-red-100">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Vắng mặt</span>
                <p className="text-red-500 font-black text-lg mt-1">{stats?.absentDays || 0}</p>
              </div>
            </div>
          </div>
        </Card>
        
        {/* NHẬT KÝ */}
        <Card className="p-6 rounded-2xl shadow-sm ring-1 ring-gray-100 border-0">
          <div className="flex items-center gap-2 mb-6">
            <Activity size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-800">Nhật ký hệ thống</h2>
          </div>
          <div className="space-y-0">
            {(recentActivities || []).map((text, i) => (
              <div className="relative flex gap-4 items-start pb-6 last:pb-0" key={i}>
                {i !== (recentActivities || []).length - 1 && (
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
              <div className="text-center text-sm text-gray-400 py-4 italic">Không có sự kiện mới</div>
            )}
          </div>
        </Card>
        
      </div>
    </MainLayout>
  );
}