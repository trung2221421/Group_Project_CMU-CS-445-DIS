import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  AlertTriangle, Briefcase, Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  Coins, Download, FileText, Mars, PieChart, Printer, TrendingUp, Users, Venus, WalletCards,
} from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import DepartmentChart from '../components/charts/DepartmentChart.jsx';
import { statusBadge } from '../components/ui/Table.jsx';

const API_URL = 'http://localhost:8000/api/v1/reports/monthly';
const ITEMS_PER_PAGE = 8;
const ABSENT_PER_PAGE = 5;

const defaultReportData = {
  loading: true, error: null,
  stats: { monthlyPayroll: '0 VND', totalEmployees: 0, maleCount: 0, femaleCount: 0, workDays: 0, leaveDays: 0, absentDays: 0, totalSalary: 0, averageSalary: 0 },
  topAbsentEmployees: [], salaryTrend: [], payrollRows: [], departmentData: [], dividendsData: [],
  analysis: { salaryText: '', attendanceText: '', employeeText: '', dividendText: '' },
};

const pageWrapStyle = { padding: 28, background: '#f8fafc', minHeight: '100vh' };
const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, boxShadow: '0 12px 36px rgba(15,23,42,0.06)', overflow: 'hidden' };
const sectionHeaderStyle = { display: 'flex', alignItems: 'center', gap: 14, padding: '22px 26px', borderBottom: '1px solid #eef2f7', background: '#fff' };
const thStyle = { padding: '15px 16px', textAlign: 'left', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' };
const tdStyle = { padding: '16px 16px', fontSize: 14, color: '#0f172a', borderBottom: '1px solid #eef2f7', verticalAlign: 'middle', whiteSpace: 'normal', wordBreak: 'break-word' };
const buttonStyle = { height: 44, border: 'none', borderRadius: 14, padding: '0 18px', color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap' };
const pageButtonStyle = (active = false, disabled = false) => ({
  minWidth: 38, height: 38, padding: '0 12px', borderRadius: 10,
  border: active ? '1px solid #4f46e5' : '1px solid #e5e7eb',
  background: disabled ? '#f1f5f9' : active ? '#4f46e5' : '#fff',
  color: disabled ? '#cbd5e1' : active ? '#fff' : '#475569',
  fontSize: 14, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: active ? '0 10px 18px rgba(79,70,229,0.22)' : 'none',
});

function formatValue(v) { return v===null||v===undefined||v===''||v==='--'?'--':v; }
function formatMoney(v) { const n = Number(v||0); return isNaN(n) ? '0 đ' : n.toLocaleString('vi-VN')+' đ'; }
function formatDate(v) { if(!v||v==='--') return '--'; const d = new Date(v); return isNaN(d.getTime())? v : d.toLocaleDateString('vi-VN'); }

// === Hàm escape CSV chuẩn RFC 4180 ===
function csvEscape(cell) {
  if (cell === undefined || cell === null) return '';
  let str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    str = `"${str}"`;
  }
  return str;
}

// === Xuất CSV chuyên nghiệp, mỗi section là một bảng, delimiter là dấu phẩy ===
function downloadCsv(filename, selectedDate, data) {
  const { month, year } = selectedDate;
  const period = `${String(month).padStart(2, '0')}/${year}`;
  const allRows = [];

  // Helper thêm dòng
  const addRow = (...cols) => allRows.push(cols.map(csvEscape).join(','));

  // 1. Tiêu đề chính
  addRow(`BÁO CÁO TỔNG HỢP HR - PAYROLL`, `Kỳ: tháng ${period}`);
  addRow(); // dòng trống

  // 2. Tổng quan
  addRow('CHỈ TIÊU', 'GIÁ TRỊ');
  addRow('Tổng nhân viên', data.stats.totalEmployees);
  addRow('Nam', data.stats.maleCount);
  addRow('Nữ', data.stats.femaleCount);
  addRow(`Tỷ lệ nam (${data.stats.maleCount}/${data.stats.totalEmployees})`, `${((data.stats.maleCount/(data.stats.totalEmployees||1))*100).toFixed(1)}%`);
  addRow(`Tỷ lệ nữ (${data.stats.femaleCount}/${data.stats.totalEmployees})`, `${((data.stats.femaleCount/(data.stats.totalEmployees||1))*100).toFixed(1)}%`);
  addRow('Tổng quỹ lương', data.stats.monthlyPayroll);
  addRow('Ngày công', data.stats.workDays);
  addRow('Nghỉ phép', data.stats.leaveDays);
  addRow('Vắng mặt', data.stats.absentDays);
  addRow();

  // 3. Cơ cấu phòng ban
  addRow('CƠ CẤU PHÒNG BAN');
  addRow('Phòng ban', 'Số lượng nhân viên');
  data.departmentData.forEach(d => addRow(d.name, d.value));
  addRow();

  // 4. Biến động quỹ lương
  addRow('BIẾN ĐỘNG QUỸ LƯƠNG THEO THÁNG');
  addRow('Tháng', 'Tổng lương (VND)');
  data.salaryTrend.forEach(t => addRow(t.label, formatMoney(t.value)));
  addRow();

  // 5. Cổ tức
  addRow('BÁO CÁO CỔ TỨC');
  addRow('Mã NV', 'Họ tên', 'Phòng ban', 'Ngày chia', 'Số tiền');
  data.dividendsData.forEach(d => addRow(d.id, d.name, d.dept, formatDate(d.date), formatMoney(d.amount)));
  addRow();

  // 6. Nhân sự vắng mặt nhiều nhất
  addRow('NHÂN SỰ VẮNG MẶT NHIỀU NHẤT');
  addRow('Mã NV', 'Họ tên', 'Phòng ban', 'Số ngày vắng', 'Ghi chú');
  data.topAbsentEmployees.forEach(e => addRow(e.id, e.name, e.dept, e.absentCount, e.reason || '--'));
  addRow();

  // 7. Chi tiết bảng lương
  addRow('CHI TIẾT LƯƠNG & NHÂN SỰ');
  addRow('Mã NV', 'Họ tên', 'Phòng ban', 'Lương cơ bản', 'Thưởng', 'Khấu trừ', 'Thực nhận', 'Ngày công', 'Nghỉ phép', 'Vắng mặt', 'Trạng thái');
  data.payrollRows.forEach(r => {
    addRow(r.id, r.name, r.dept,
      formatMoney(r.baseSalary), formatMoney(r.bonus), formatMoney(r.deductions),
      formatMoney(r.salary), r.workDays, r.leaveDays, r.absentDays, r.status);
  });
  addRow();

  // 8. Nhận xét phân tích
  addRow('NHẬN XÉT PHÂN TÍCH');
  addRow('Loại', 'Nội dung');
  addRow('Nhân sự', data.analysis.employeeText);
  addRow('Tiền lương', data.analysis.salaryText);
  addRow('Chuyên cần', data.analysis.attendanceText);
  addRow('Cổ tức', data.analysis.dividendText);

  // Tạo blob CSV với BOM UTF-8
  const blob = new Blob(['\uFEFF' + allRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// === In PDF (toàn bộ báo cáo, không mất nội dung) ===
function handlePrintFullReport() {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Cửa sổ in bị chặn. Vui lòng cho phép popup.');
    return;
  }

  const reportContainer = document.querySelector('#report-content');
  if (!reportContainer) {
    alert('Không tìm thấy nội dung báo cáo để in.');
    return;
  }

  const contentClone = reportContainer.cloneNode(true);
  const noPrintElements = contentClone.querySelectorAll('.no-print');
  noPrintElements.forEach(el => el.remove());

  const style = document.createElement('style');
  style.textContent = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: white; color: #0f172a; }
    .print-container { max-width: 1200px; margin: 0 auto; }
    .card { border: none !important; box-shadow: none !important; }
    table { border: 1px solid #000; }
    th, td { border: 1px solid #000; padding: 8px; }
    footer { margin-top: 30px; font-size: 10px; text-align: center; color: #94a3b8; }
    @media print { body { padding: 0; } }
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><title>Báo cáo HR-Payroll</title>${style.outerHTML}</head>
    <body>
      <div class="print-container">${contentClone.innerHTML}</div>
      <footer>In lúc ${new Date().toLocaleString('vi-VN')}</footer>
    </body>
    </html>
  `);
  printWindow.document.close();

  // Đợi document sẵn sàng rồi mới gọi in
  printWindow.onload = function() {
    printWindow.focus();
    printWindow.print();
    // Tự đóng sau khi hộp thoại in kết thúc (kể cả khi bấm Hủy)
    printWindow.onafterprint = function() {
      printWindow.close();
    };
  };
}

function normalizeDepartmentData(data) {
  if(!Array.isArray(data)) return [];
  return data.map(item => {
    if(Array.isArray(item)) return { name: item[0]||'Chưa phân bổ', value: Number(item[2]??item[1]??0) };
    return { name: item.name||item.department||item.DepartmentName||item.departmentName||item.department_name||'Chưa phân bổ', value: Number(item.value||item.count||item.EmployeeCount||item.employeeCount||item.employee_count||0) };
  });
}

function normalizeSalaryTrend(data, year) {
  const base = Array.from({length:12}, (_,i)=>({ month:i+1, label:`T${String(i+1).padStart(2,'0')}/${String(year).slice(-2)}`, value:0, amount:0, total:0, payroll:0 }));
  if(!Array.isArray(data)) return base;
  data.forEach(item=>{
    const month = Number(item.month)||Number(item.Month)||Number(item.salaryMonth)||Number(item.SalaryMonth)||Number(String(item.label||item.monthLabel||'').match(/\d+/)?.[0]);
    const amount = Number(item.value)||Number(item.amount)||Number(item.total)||Number(item.totalSalary)||Number(item.TotalSalary)||Number(item.monthlyPayroll)||Number(item.NetSalary)||0;
    if(month>=1&&month<=12) base[month-1] = {...base[month-1], ...item, month, label:`T${String(month).padStart(2,'0')}/${String(year).slice(-2)}`, value:amount, amount, total:amount, payroll:amount };
  });
  return base;
}

function SectionHeader({ icon: Icon, title, subtitle, tone = '#4f46e5' }) {
  return (
    <div style={sectionHeaderStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${tone}15`, color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 950, color: '#0f172a' }}>{title}</h2>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function AnalysisBox({ icon: Icon, title, text, tone = '#4f46e5' }) {
  return (
    <div style={{ padding: 16, background: '#f8fafc', borderTop: '1px solid #eef2f7', display: 'flex', gap: 12 }}>
      <div><Icon size={16} color={tone} /></div>
      <div>
        <h4 style={{ margin: 0, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8' }}>{title}</h4>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', fontStyle: 'italic' }}>“{text || 'Đang tổng hợp...'}”</p>
      </div>
    </div>
  );
}

function EmptyTableRow({ colSpan, text }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#94a3b8', fontStyle: 'italic' }}>
        {text}
      </td>
    </tr>
  );
}

function SimpleTable({ columns, rows, emptyText }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={thStyle}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <tr key={row.key || idx}>
                {columns.map((col) => (
                  <td key={col.key} style={tdStyle}>
                    {col.render ? col.render(row, idx) : formatValue(row[col.key])}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <EmptyTableRow colSpan={columns.length} text={emptyText} />
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState({ month: today.getMonth()+1, year: today.getFullYear() });
  const [currentPage, setCurrentPage] = useState(1);
  const [absentPage, setAbsentPage] = useState(1);
  const [reportData, setReportData] = useState(defaultReportData);

  const getValue = (row, field) => {
    if(!row) return '--';
    switch(field){
      case 'id': return row.id??row.EmployeeID??row.EmployeesID??'--';
      case 'name': return row.name??row.FullName??'--';
      case 'dept': return row.dept??row.DepartmentName??row.department??'--';
      case 'salary': return row.salary??row.NetSalary??row.netSalary??0;
      case 'baseSalary': return row.baseSalary??row.BaseSalary??row.salary??0;
      case 'bonus': return row.bonus??row.Bonus??0;
      case 'deductions': return row.deductions??row.Deductions??0;
      case 'status': return row.status??row.Status??'pending';
      case 'workDays': return row.workDays??row.WorkDays??0;
      case 'leaveDays': return row.leaveDays??row.LeaveDays??0;
      case 'absentDays': return row.absentDays??row.AbsentDays??0;
      default: return row[field]??'--';
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      setReportData(prev=>({...prev, loading:true, error:null}));
      try {
        const res = await axios.get(API_URL, { params: { month: selectedDate.month, year: selectedDate.year } });
        const apiData = res.data?.data || res.data || {};
        setReportData(prev=>({
          ...prev, ...apiData, loading:false, error:null,
          stats: {...prev.stats, ...(apiData.stats||{})},
          topAbsentEmployees: apiData.topAbsentEmployees||apiData.top_absent_employees||[],
          salaryTrend: normalizeSalaryTrend(apiData.salaryTrend||apiData.salary_trend||[], selectedDate.year),
          payrollRows: apiData.payrollRows||apiData.payroll_rows||apiData.employees||[],
          departmentData: normalizeDepartmentData(apiData.departmentData||apiData.departmentReports||apiData.department_breakdown||[]),
          dividendsData: apiData.dividendsData||apiData.dividendReports||apiData.dividends||[],
          analysis: {...prev.analysis, ...(apiData.analysis||{})},
        }));
        setCurrentPage(1); setAbsentPage(1);
      } catch(err) {
        console.error(err);
        setReportData(prev=>({...prev, loading:false, error:'Không thể kết nối Backend hoặc API báo cáo chưa sẵn sàng.'}));
      }
    };
    fetchReport();
  }, [selectedDate]);

  const validRows = Array.isArray(reportData.payrollRows) ? reportData.payrollRows : [];
  const totalPages = Math.max(1, Math.ceil(validRows.length / ITEMS_PER_PAGE));
  const safePage = Math.min(Math.max(currentPage,1), totalPages);
  const currentRows = validRows.slice((safePage-1)*ITEMS_PER_PAGE, safePage*ITEMS_PER_PAGE);

  const totalEmployees = Number(reportData.stats.totalEmployees||0);
  const maleCount = Number(reportData.stats.maleCount||0);
  const femaleCount = Number(reportData.stats.femaleCount||0);
  const malePercent = ((maleCount/(totalEmployees||1))*100).toFixed(1);
  const femalePercent = ((femaleCount/(totalEmployees||1))*100).toFixed(1);

  const summaryCards = useMemo(()=>[
    { label:'Tổng nhân viên', value:totalEmployees.toLocaleString('vi-VN'), icon:Users, tone:'#2563eb' },
    { label:'Tổng quỹ lương', value:reportData.stats.monthlyPayroll||formatMoney(reportData.stats.totalSalary), icon:WalletCards, tone:'#059669' },
    { label:'Ngày công', value:Number(reportData.stats.workDays||0).toLocaleString('vi-VN'), icon:CheckCircle2, tone:'#7c3aed' },
    { label:'Vắng mặt', value:Number(reportData.stats.absentDays||0).toLocaleString('vi-VN'), icon:AlertTriangle, tone:'#e11d48' },
  ], [reportData.stats, totalEmployees]);

  const sortedAbsent = useMemo(() => {
    const list = [...reportData.topAbsentEmployees];
    list.sort((a,b)=>(b.absentCount||0)-(a.absentCount||0));
    return list;
  }, [reportData.topAbsentEmployees]);
  const totalAbsentPages = Math.ceil(sortedAbsent.length / ABSENT_PER_PAGE) || 1;
  const safeAbsentPage = Math.min(Math.max(absentPage,1), totalAbsentPages);
  const currentAbsentRows = sortedAbsent.slice((safeAbsentPage-1)*ABSENT_PER_PAGE, safeAbsentPage*ABSENT_PER_PAGE);

  const handleMonthChange = (date) => { if(date) setSelectedDate({ month: date.getMonth()+1, year: date.getFullYear() }); };
  const handleExportCSV = () => {
    const period = `${String(selectedDate.month).padStart(2,'0')}-${selectedDate.year}`;
    downloadCsv(`Bao_cao_HR_${period}.csv`, selectedDate, {
      stats: reportData.stats,
      departmentData: reportData.departmentData,
      salaryTrend: reportData.salaryTrend,
      dividendsData: reportData.dividendsData,
      topAbsentEmployees: sortedAbsent,
      payrollRows: validRows,
      analysis: reportData.analysis,
    });
  };

  if(reportData.loading) return <MainLayout><div style={{minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14}}><div style={{width:42, height:42, borderRadius:'50%', border:'4px solid #dbeafe', borderTopColor:'#4f46e5', animation:'spin 0.8s linear infinite'}}/><p style={{color:'#64748b', fontWeight:700}}>Đang tải dữ liệu báo cáo...</p></div></MainLayout>;

  return (
    <MainLayout>
      <div style={pageWrapStyle}>
        {/* Toolbar - no print */}
        <div className="no-print" style={{...cardStyle, padding:24, marginBottom:26, display:'flex', alignItems:'center', justifyContent:'space-between', gap:18, flexWrap:'wrap'}}>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <div style={{width:52, height:52, borderRadius:17, background:'#eef2ff', color:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center'}}><FileText size={25}/></div>
            <div><h1 style={{margin:0, fontSize:26, fontWeight:950, color:'#0f172a'}}>Báo cáo tổng hợp HR - Payroll</h1><p style={{margin:'6px 0 0', color:'#64748b', fontSize:14, fontWeight:700}}>Kỳ báo cáo: tháng {selectedDate.month}/{selectedDate.year}</p></div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <label style={{height:44, border:'1px solid #e5e7eb', borderRadius:14, padding:'0 14px', display:'inline-flex', alignItems:'center', gap:10, background:'#fff', color:'#334155', fontWeight:800}}>
              <Calendar size={18}/>
              <DatePicker selected={new Date(selectedDate.year, selectedDate.month-1)} onChange={handleMonthChange} dateFormat="MM/yyyy" showMonthYearPicker className="custom-datepicker" />
            </label>
            <button onClick={handleExportCSV} style={{...buttonStyle, background:'#059669', boxShadow:'0 12px 24px rgba(5,150,105,0.24)'}}><Download size={18}/> Xuất CSV</button>
            <button onClick={handlePrintFullReport} style={{...buttonStyle, background:'#0f172a', boxShadow:'0 12px 24px rgba(15,23,42,0.18)'}}><Printer size={18}/> In / PDF</button>
          </div>
        </div>

        {reportData.error && <div style={{...cardStyle, padding:18, marginBottom:24, color:'#b91c1c', background:'#fef2f2', borderColor:'#fecaca', fontWeight:800}}>{reportData.error}</div>}

        {/* Nội dung báo cáo chính - sẽ được in */}
        <div id="report-content">
          {!reportData.error && <div style={{display:'flex', flexDirection:'column', gap:26}}>
            {/* 4 summary cards */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:18}}>
              {summaryCards.map(item=>(
                <div key={item.label} style={{...cardStyle, padding:20}}>
                  <div style={{display:'flex', alignItems:'center', gap:14}}>
                    <div style={{width:44, height:44, borderRadius:15, background:`${item.tone}15`, color:item.tone, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}><item.icon size={22}/></div>
                    <div>
                      <p style={{margin:0, fontSize:12, color:'#64748b', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em'}}>{item.label}</p>
                      <h3 style={{margin:'6px 0 0', fontSize:22, fontWeight:950, color:'#0f172a'}}>{item.value}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Left: HR scale, Right: Department chart */}
            <div style={{display:'grid', gridTemplateColumns:'minmax(320px,1fr) minmax(420px,2fr)', gap:22}}>
              <div>
                <div style={cardStyle}>
                  <SectionHeader icon={Users} title="Quy mô nhân sự" subtitle="Tổng quan số lượng và cơ cấu giới tính" tone="#2563eb"/>
                  <div style={{padding:24}}>
                    <div style={{padding:18, borderRadius:20, background:'#f8fafc', border:'1px solid #eef2f7', textAlign:'center'}}>
                      <p style={{margin:0, fontSize:17, color:'#334155', fontWeight:800}}>Quy mô hiện tại</p>
                      <h3 style={{margin:'8px 0 0', fontSize:34, color:'#0f172a', fontWeight:950}}>{totalEmployees}</h3>
                      <p style={{margin:'4px 0 0', color:'#64748b', fontWeight:700}}>nhân sự</p>
                    </div>
                  </div>
                  <div style={{marginTop:22, display:'grid', gap:14, padding:'0 24px 24px'}}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, borderRadius:16, border:'1px solid #dbeafe', background:'#eff6ff'}}>
                      <div style={{display:'flex', alignItems:'center', gap:10}}><Mars size={24} color="#2563eb"/><strong>Nam</strong></div>
                      <strong style={{color:'#2563eb'}}>{maleCount} người · {malePercent}%</strong>
                    </div>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:16, borderRadius:16, border:'1px solid #ffe4e6', background:'#fff1f2'}}>
                      <div style={{display:'flex', alignItems:'center', gap:10}}><Venus size={24} color="#e11d48"/><strong>Nữ</strong></div>
                      <strong style={{color:'#e11d48'}}>{femaleCount} người · {femalePercent}%</strong>
                    </div>
                  </div>
                </div>
                <AnalysisBox icon={CheckCircle2} title="Nhận xét nhân sự" text={reportData.analysis.employeeText} tone="#2563eb"/>
              </div>
              <div style={cardStyle}>
                <SectionHeader icon={Briefcase} title="Cơ cấu phòng ban" subtitle="Phân bổ nhân sự theo phòng ban thực tế" tone="#4f46e5"/>
                <div style={{padding:24, minHeight:330}}>
                  {reportData.departmentData.length>0 ? <DepartmentChart data={reportData.departmentData}/> : <div style={{height:280, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontWeight:700, fontStyle:'italic'}}>Chưa có dữ liệu phòng ban</div>}
                </div>
              </div>
            </div>

            {/* Salary trend & Attendance pie */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,minmax(0,1fr))', gap:22}}>
              <div style={cardStyle}>
                <SectionHeader icon={TrendingUp} title="Biến động quỹ lương" subtitle="Xu hướng tổng lương theo kỳ" tone="#059669"/>
                <div style={{padding:24, height:310}}><BarChart data={reportData.salaryTrend}/></div>
                <AnalysisBox icon={TrendingUp} title="Nhận xét tiền lương" text={reportData.analysis.salaryText} tone="#059669"/>
              </div>
              <div style={cardStyle}>
                <SectionHeader icon={PieChart} title="Tỷ lệ chuyên cần" subtitle="Ngày công, nghỉ phép và vắng mặt" tone="#f97316"/>
                <div style={{padding:24, height:310}}><DonutChart work={reportData.stats.workDays||0} leave={reportData.stats.leaveDays||0} absent={reportData.stats.absentDays||0}/></div>
                <AnalysisBox icon={AlertTriangle} title="Nhận xét chuyên cần" text={reportData.analysis.attendanceText} tone="#f97316"/>
              </div>
            </div>

            {/* Dividends */}
            <div style={cardStyle}>
              <SectionHeader icon={Coins} title="Báo cáo cổ tức nhân viên" subtitle="Danh sách cổ tức nội bộ theo kỳ báo cáo" tone="#eab308"/>
              <SimpleTable columns={[
                {key:'id', label:'Mã NV', width:'12%'},
                {key:'name', label:'Họ và tên', width:'26%'},
                {key:'dept', label:'Phòng ban', width:'24%'},
                {key:'date', label:'Ngày chia', width:'18%', render:row=>formatDate(row.date||row.DividendDate)},
                {key:'amount', label:'Số tiền', width:'20%', render:row=><strong style={{color:'#059669'}}>{formatMoney(row.amount||row.DividendAmount)}</strong>}
              ]} rows={reportData.dividendsData} emptyText="Chưa có dữ liệu cổ tức trong kỳ này"/>
              <AnalysisBox icon={CheckCircle2} title="Nhận xét cổ tức" text={reportData.analysis.dividendText} tone="#eab308"/>
            </div>

            {/* Top absent employees with pagination */}
            <div style={cardStyle}>
              <SectionHeader icon={AlertTriangle} title="Nhân sự vắng mặt nhiều nhất" subtitle="Mỗi trang 5 nhân viên (sắp xếp giảm dần)" tone="#e11d48"/>
              <SimpleTable columns={[
                {key:'id', label:'Mã NV', width:'12%'},
                {key:'name', label:'Họ và tên', width:'28%'},
                {key:'dept', label:'Phòng ban', width:'25%'},
                {key:'absentCount', label:'Số ngày vắng', width:'15%', render:row=><strong style={{color:'#e11d48'}}>{row.absentCount||row.AbsentDays||row.absentDays||0} ngày</strong>},
                {key:'reason', label:'Ghi chú', width:'20%', render:row=>row.reason||row.note||'--'}
              ]} rows={currentAbsentRows} emptyText="Không có dữ liệu vắng mặt nổi bật"/>
              {totalAbsentPages>1 && (
                <div className="no-print" style={{display:'flex', justifyContent:'center', alignItems:'center', gap:8, padding:'16px 24px', borderTop:'1px solid #eef2f7'}}>
                  <button onClick={()=>setAbsentPage(p=>Math.max(1,p-1))} disabled={safeAbsentPage<=1} style={pageButtonStyle(false, safeAbsentPage<=1)}><ChevronLeft size={18}/></button>
                  <span style={{fontSize:14, fontWeight:600, color:'#475569'}}>Trang {safeAbsentPage} / {totalAbsentPages}</span>
                  <button onClick={()=>setAbsentPage(p=>Math.min(totalAbsentPages,p+1))} disabled={safeAbsentPage>=totalAbsentPages} style={pageButtonStyle(false, safeAbsentPage>=totalAbsentPages)}><ChevronRight size={18}/></button>
                </div>
              )}
              <AnalysisBox icon={AlertTriangle} title="Nhận xét chuyên cần" text={reportData.analysis.attendanceText} tone="#e11d48"/>
            </div>

            {/* Detailed payroll table with pagination */}
            <div style={cardStyle}>
              <SectionHeader icon={WalletCards} title="Chi tiết bảng lương & Nhân sự" subtitle="Báo cáo chi tiết từng cá nhân trong kỳ" tone="#2563eb"/>
              <SimpleTable columns={[
                {key:'id', label:'Mã NV', width:'8%', nowrap:true},
                {key:'name', label:'Họ và tên', width:'21%', render:row=><strong>{getValue(row,'name')}</strong>},
                {key:'dept', label:'Phòng ban', width:'18%'},
                {key:'salary', label:'Thực nhận', width:'16%', nowrap:true, render:row=><strong style={{color:'#059669', background:'#ecfdf5', padding:'6px 10px', borderRadius:9, display:'inline-block'}}>{formatMoney(getValue(row,'salary'))}</strong>},
                {key:'attendance', label:'Chuyên cần', width:'22%', render:row=><span>Công: {getValue(row,'workDays')} · Nghỉ: {getValue(row,'leaveDays')} · Vắng: {getValue(row,'absentDays')}</span>},
                {key:'status', label:'Trạng thái', width:'15%', nowrap:true, render:row=>statusBadge(getValue(row,'status'))}
              ]} rows={currentRows} emptyText="Không có dữ liệu lương nhân viên"/>
              <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 24px', background:'#f8fafc', borderTop:'1px solid #eef2f7', gap:16, flexWrap:'wrap'}}>
                <span>Hiển thị {validRows.length===0?0:(safePage-1)*ITEMS_PER_PAGE+1} - {Math.min(safePage*ITEMS_PER_PAGE, validRows.length)} / {validRows.length}</span>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <button disabled={safePage<=1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))} style={pageButtonStyle(false, safePage<=1)}><ChevronLeft size={18}/></button>
                  {Array.from({length:totalPages},(_,i)=>{ const p=i+1; const active=safePage===p; return <button key={p} onClick={()=>setCurrentPage(p)} style={pageButtonStyle(active)}>{p}</button>;})}
                  <button disabled={safePage>=totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))} style={pageButtonStyle(false, safePage>=totalPages)}><ChevronRight size={18}/></button>
                </div>
              </div>
              <AnalysisBox icon={TrendingUp} title="Báo cáo tiền lương chi tiết" text={reportData.analysis.salaryText} tone="#2563eb"/>
            </div>
          </div>}
        </div>
      </div>
    </MainLayout>
  );
}