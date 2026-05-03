import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Printer, TrendingUp, AlertTriangle, FileSpreadsheet, 
  Users, PieChart, Briefcase, Coins, Mars, Venus, 
  MoreVertical, FileText, CheckCircle2, Eye,
  ChevronLeft, ChevronRight, Calendar
} from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx'; 
import Card from '../components/ui/Card.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import DepartmentChart from '../components/charts/DepartmentChart.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';

// Component hiển thị phân tích sau mỗi bảng
const TableAnalysis = ({ icon: Icon, title, text }) => (
  <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 items-start print:bg-white">
    <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-400">
      <Icon size={16} />
    </div>
    <div>
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</h4>
      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">"{text || "Hệ thống đang tổng hợp dữ liệu phân tích..."}"</p>
    </div>
  </div>
);

export default function Reports() {
  const [selectedDate, setSelectedDate] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });
  
  // State cho phân trang bảng lương
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [reportData, setReportData] = useState({
    loading: true, error: null,
    stats: { monthlyPayroll: '0 VND', totalEmployees: 0, maleCount: 0, femaleCount: 0 },
    topAbsentEmployees: [], salaryTrend: [], payrollRows: [], departmentData: [], dividendsData: [],
    analysis: { salaryText: "", attendanceText: "", employeeText: "", dividendText: "" }
  });

  // Hàm tra cứu dữ liệu an toàn (Chống lỗi undefined)
  const getValue = (row, field) => {
    if (!row) return '--';
    switch (field) {
      case 'id': return row.id ?? row.EmployeeID ?? row.EmployeesID ?? '--';
      case 'name': return row.name ?? row.FullName ?? '--';
      case 'dept': return row.dept ?? row.DepartmentName ?? '--';
      case 'salary': return row.salary ?? row.NetSalary ?? 0;
      case 'status': return row.status ?? row.Status ?? 'pending';
      default: return row[field] ?? '--';
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      setReportData(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await axios.get('http://localhost:8000/api/v1/reports/monthly', {
          params: { month: selectedDate.month, year: selectedDate.year }
        });
        setReportData({ loading: false, error: null, ...response.data });
        setCurrentPage(1); // Reset về trang 1 khi đổi tháng
      } catch (error) {
        setReportData(prev => ({ ...prev, loading: false, error: "Không thể kết nối Backend." }));
      }
    };
    fetchReport();
  }, [selectedDate]);

  // Logic phân trang
  const validRows = Array.isArray(reportData.payrollRows) ? reportData.payrollRows : [];
  const totalPages = Math.max(1, Math.ceil(validRows.length / itemsPerPage));
  const currentRows = validRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Tính % giới tính
  const malePercent = ((reportData.stats.maleCount / (reportData.stats.totalEmployees || 1)) * 100).toFixed(1);
  const femalePercent = ((reportData.stats.femaleCount / (reportData.stats.totalEmployees || 1)) * 100).toFixed(1);

  return (
    <MainLayout>
      <div className="p-6 md:p-8 space-y-8 bg-slate-50 min-h-screen print:p-0 print:bg-white">
        
        {/* THANH ĐIỀU HƯỚNG (Bị ẩn khi in) */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:hidden">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100"><FileText size={24} /></div>
             <div>
                <h1 className="text-xl font-black text-slate-800 uppercase">Trình xuất báo cáo chi tiết</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Kỳ báo cáo: {selectedDate.month} / {selectedDate.year}</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="month" className="px-4 py-2 border-2 border-slate-100 rounded-xl font-bold text-slate-700 outline-none" value={`${selectedDate.year}-${selectedDate.month.toString().padStart(2, '0')}`} onChange={(e) => { const [y, m] = e.target.value.split('-'); setSelectedDate({ month: parseInt(m), year: parseInt(y) }); }} />
            <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-xl"><Printer size={18} /> IN BÁO CÁO</button>
          </div>
        </div>

        {!reportData.loading && !reportData.error && (
          <div className="space-y-8">
            
            {/* 1. KHỐI QUY MÔ NHÂN SỰ & BIỂU ĐỒ PHÒNG BAN */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personnel Scale Section - ĐÃ SỬA THEO YÊU CẦU */}
                <div className="lg:col-span-1 bg-white border-2 border-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl print:border print:shadow-none">
                    <div className="bg-slate-900 p-8 text-white print:bg-slate-100 print:text-black">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Company Overview</span>
                        <h2 className="text-lg font-bold mt-1 uppercase">Quy mô nhân sự</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                           <p className="text-xl font-black text-slate-800 italic">" Quy mô {reportData.stats.totalEmployees} nhân sự. "</p>
                        </div>
                        
                        <div className="space-y-6">
                            {/* Dòng Nam */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Mars size={24} className="text-blue-500" strokeWidth={3}/>
                                    <span className="font-bold text-slate-600 text-lg">Nam</span>
                                </div>
                                <p className="text-slate-800 font-medium text-lg">
                                    <span className="font-black text-2xl">{reportData.stats.maleCount}</span> người chiếm <span className="text-blue-600 font-black">{malePercent}%</span>
                                </p>
                            </div>

                            {/* Dòng Nữ */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Venus size={24} className="text-rose-500" strokeWidth={3}/>
                                    <span className="font-bold text-slate-600 text-lg">Nữ</span>
                                </div>
                                <p className="text-slate-800 font-medium text-lg">
                                    <span className="font-black text-2xl">{reportData.stats.femaleCount}</span> người chiếm <span className="text-rose-600 font-black">{femalePercent}%</span>
                                </p>
                            </div>
                        </div>
                        <div className="pt-6 border-t border-slate-100 text-xs text-slate-400 font-bold uppercase italic text-center">
                           {reportData.analysis.employeeText}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-3 mb-8"><Briefcase className="text-indigo-600"/> Cơ cấu phòng ban thực tế</h3>
                    <div className="flex-1 min-h-[300px] w-full"><DepartmentChart data={reportData.departmentData} /></div>
                </div>
            </div>

            {/* 2. BIỂU ĐỒ PHÂN TÍCH LƯƠNG & CHUYÊN CẦN */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 uppercase"><TrendingUp size={20} className="text-emerald-500"/> Biến động Quỹ lương</h3>
                    <div className="h-[250px] mb-4 w-full"><BarChart data={reportData.salaryTrend} /></div>
                    <div className="mt-auto p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl"><p className="text-sm text-emerald-900 font-medium italic">"{reportData.analysis.salaryText}"</p></div>
                </div>
                <div className="bg-white p-7 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6 uppercase"><PieChart size={20} className="text-orange-500"/> Tỷ lệ Chuyên cần</h3>
                    <div className="h-[250px] mb-4 w-full"><DonutChart work={reportData.stats.workDays} leave={reportData.stats.leaveDays} absent={reportData.stats.absentDays}/></div>
                    <div className="mt-auto p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-xl"><p className="text-sm text-orange-900 font-medium italic">"{reportData.analysis.attendanceText}"</p></div>
                </div>
            </div>

            {/* 3. CÁC BẢNG DỮ LIỆU CHUẨN CÓ VIỀN VÀ PHÂN TÍCH */}
            <div className="space-y-10">
                
                {/* BẢNG CỔ TỨC */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:break-inside-avoid">
                    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/5 flex items-center gap-2">
                        <Coins size={20} className="text-yellow-500"/>
                        <h3 className="font-black text-slate-800 uppercase">Báo cáo cổ tức nhân viên</h3>
                    </div>
                    <div className="p-4">
                        <Table 
                            columns={[{ key: 'id', label: 'Mã NV' }, { key: 'name', label: 'Họ và tên' }, { key: 'dept', label: 'Phòng ban' }, { key: 'date', label: 'Ngày chia' }, { key: 'amount', label: 'Số tiền' }]}
                            rows={reportData.dividendsData}
                            renderCell={(row, col) => {
                                if (col.key === 'amount') return <span className="font-black text-emerald-600">{Number(row.amount).toLocaleString()} đ</span>;
                                if (col.key === 'date') return row.date ? new Date(row.date).toLocaleDateString('vi-VN') : '--';
                                if (col.key === 'name') return <span className="font-bold text-slate-800">{row.name}</span>;
                                return <span className="font-medium text-slate-600">{formatValue(getValue(row, col.key))}</span>;
                            }}
                        />
                    </div>
                    <TableAnalysis icon={CheckCircle2} title="Nhận xét Cổ tức" text={reportData.analysis.dividendText} />
                </div>

                {/* BẢNG VẮNG MẶT */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden print:break-inside-avoid">
                    <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/5 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-rose-500"/>
                        <h3 className="font-black text-slate-800 uppercase">Nhân sự vắng mặt nhiều nhất</h3>
                    </div>
                    <div className="p-4">
                        <Table 
                            columns={[{ key: 'id', label: 'Mã NV' }, { key: 'name', label: 'Họ và tên' }, { key: 'dept', label: 'Phòng ban' }, { key: 'absentCount', label: 'Số ngày' }, { key: 'reason', label: 'Ghi chú' }]}
                            rows={reportData.topAbsentEmployees}
                            renderCell={(row, col) => {
                                if (col.key === 'absentCount') return <span className="font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-lg">{row.absentCount} ngày</span>;
                                if (col.key === 'name') return <span className="font-bold text-slate-800">{row.name}</span>;
                                return <span className="font-medium text-slate-500">{formatValue(getValue(row, col.key))}</span>;
                            }}
                        />
                    </div>
                    <TableAnalysis icon={AlertTriangle} title="Nhận xét chuyên cần" text={reportData.analysis.attendanceText} />
                </div>

                {/* 🌟 BẢNG CHI TIẾT LƯƠNG & NHÂN SỰ - FIX THEO CODE DASHBOARD 🌟 */}
                <Card className="border-0 shadow-sm ring-1 ring-gray-100 rounded-2xl overflow-hidden mb-8 print:ring-1 print:ring-slate-300 print:break-before-page">
                    <div className="flex flex-col sm:flex-row justify-between items-center p-5 bg-white border-b border-gray-100">
                        <div className="flex items-center gap-3 w-full sm:w-auto mb-4 sm:mb-0">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><Users size={20} /></div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tighter">Chi tiết bảng lương & Nhân sự</h2>
                                <p className="text-xs text-gray-500 font-bold italic">Báo cáo chi tiết từng cá nhân trong kỳ</p>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[380px] bg-white p-4">
                        <Table 
                            columns={[
                                { key: 'id', label: 'Mã NV' },
                                { key: 'name', label: 'Họ và tên' },
                                { key: 'dept', label: 'Phòng ban' },
                                { key: 'salary', label: 'Thực nhận' },
                                { key: 'status', label: 'Trạng thái' },
                                { key: 'action', label: 'Tác vụ' }
                            ]} 
                            rows={currentRows} 
                            renderCell={(row, col) => {
                                const value = getValue(row, col.key);
                                if (col.key === 'status') return statusBadge(value);
                                if (col.key === 'salary') {
                                    const numValue = Number(value);
                                    return <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">{!isNaN(numValue) ? numValue.toLocaleString('vi-VN') + ' đ' : '--'}</span>;
                                }
                                if (col.key === 'action') return (
                                    <button type="button" className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><MoreVertical size={18} /></button>
                                );
                                if (col.key === 'name') return <span className="font-semibold text-gray-800">{value}</span>;
                                return <span className="text-gray-600 font-medium italic">{value === '--' ? '--' : value}</span>;
                            }} 
                        />
                    </div>

                    {/* PHÂN TRANG (Chỉ hiện ở Web, ẩn khi In) */}
                    <div className="flex items-center justify-end sm:justify-between px-6 py-4 bg-gray-50 border-t border-gray-100 print:hidden">
                        <span className="text-sm font-medium text-gray-500 hidden sm:block">
                            Hiển thị <span className="font-bold text-gray-800">{currentPage}</span> trên <span className="font-bold text-gray-800">{totalPages}</span> trang
                        </span>
                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                            <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft size={18}/></button>
                            <div className="flex px-1 gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button key={i+1} onClick={() => setCurrentPage(i+1)} className={`min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-slate-100'}`}>{i+1}</button>
                                ))}
                            </div>
                            <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30"><ChevronRight size={18}/></button>
                        </div>
                    </div>
                    
                    {/* Báo cáo nhận xét sau bảng chi tiết */}
                    <TableAnalysis icon={TrendingUp} title="Báo cáo tiền lương chi tiết" text={reportData.analysis.salaryText} />
                </Card>

            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Hàm format dữ liệu trống thành gạch ngang
const formatValue = (v) => (v === null || v === undefined || v === '' || v === '--') ? '--' : v;