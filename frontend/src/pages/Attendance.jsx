import { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { statusBadge } from '../components/ui/Table.jsx';
import {
  getAttendanceList,
  exportAttendanceExcel,
  getEmployeeAttendanceHistory,
  getCompanyAttendanceTrend,
  getDepartmentAttendanceTrend,
  exportAllAttendanceExcel,
  exportDepartmentAttendanceExcel,
} from '../services/attendanceService';

const daysInMonth = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

export default function Attendance() {
  const [selectedMonth, setSelectedMonth] = useState('2024-09');
  const [departmentName, setDepartmentName] = useState('');
  const [search, setSearch] = useState('');
  const [attendanceList, setAttendanceList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [employeeMonthly, setEmployeeMonthly] = useState({
    workDays: 0, leaveDays: 0, absentDays: 0, attendanceRate: 0
  });

  // State cho dữ liệu trend tổng / phòng ban
  const [trendData, setTrendData] = useState([]);

  // Dropdown xuất báo cáo
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAttendanceList = async () => {
    setLoading(true);
    try {
      const list = await getAttendanceList(selectedMonth, departmentName, search);
      setAttendanceList(list);
    } catch (err) {
      console.error('Lỗi tải danh sách:', err);
      setAttendanceList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrend = async () => {
    try {
      let data;
      if (departmentName) {
        data = await getDepartmentAttendanceTrend(6, selectedMonth, departmentName);
      } else {
        data = await getCompanyAttendanceTrend(6, selectedMonth);
      }
      setTrendData(data || []);
    } catch (err) {
      console.error('Lỗi trend:', err);
      setTrendData([]);
    }
  };

  const handleRowClick = async (row) => {
    setSelectedEmployee(row);
    try {
      const hist = await getEmployeeAttendanceHistory(row.EmployeeID, 6);
      setHistoryData(hist);
    } catch (err) {
      console.error('Lỗi lịch sử:', err);
      setHistoryData([]);
    }
    const monthDays = daysInMonth(selectedMonth);
    const rate = monthDays > 0 ? Math.round((row.WorkDays / monthDays) * 100) : 0;
    setEmployeeMonthly({
      workDays: row.WorkDays,
      leaveDays: row.LeaveDays,
      absentDays: row.AbsentDays,
      attendanceRate: rate
    });
  };

  const handleFilter = () => {
    fetchAttendanceList();
    setSelectedEmployee(null);
    setHistoryData([]);
    setEmployeeMonthly({ workDays: 0, leaveDays: 0, absentDays: 0, attendanceRate: 0 });
    fetchTrend();
  };

  // Xuất báo cáo
  const handleExportAll = () => { exportAllAttendanceExcel(selectedMonth); setShowExportMenu(false); };
  const handleExportDepartment = () => {
    if (!departmentName) { alert('Vui lòng chọn phòng ban'); return; }
    exportDepartmentAttendanceExcel(selectedMonth, departmentName);
    setShowExportMenu(false);
  };
  const handleExportSelected = () => {
    if (!selectedEmployee) { alert('Vui lòng chọn nhân viên'); return; }
    exportAttendanceExcel(selectedMonth);
    setShowExportMenu(false);
  };

  useEffect(() => {
    fetchAttendanceList();
    fetchTrend();
  }, []);

  const columns = [
    { key: 'EmployeeID', label: 'Mã NV' },
    { key: 'FullName', label: 'Họ tên' },
    { key: 'DepartmentName', label: 'Phòng ban' },
    { key: 'WorkDays', label: 'Ngày công' },
    { key: 'LeaveDays', label: 'Phép' },
    { key: 'AbsentDays', label: 'Vắng' },
    { key: 'TotalOff', label: 'Tổng nghỉ' },
    { key: 'Status', label: 'Trạng thái' },
  ];

  // Chuẩn bị danh sách 6 tháng
  const monthsForChart = [];
  const [year, monthNum] = selectedMonth.split('-').map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, monthNum - 1 - i, 1);
    const label = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    monthsForChart.push(label);
  }

  let chartData = [];
  if (selectedEmployee) {
    // Chế độ cá nhân
    chartData = monthsForChart.map(month => {
      const currentMonthData = (month === selectedMonth) ? { WorkDays: selectedEmployee.WorkDays } : null;
      const rec = currentMonthData || historyData.find(r => r.AttendanceMonth === month);
      const totalDays = daysInMonth(month);
      if (!rec || totalDays === 0) return { month, percent: 0, workDays: 0 };
      const percent = Math.round((rec.WorkDays / totalDays) * 100);
      return { month, percent, workDays: rec.WorkDays };
    });
  } else {
    // Chế độ tổng (công ty hoặc phòng ban)
    const trendByMonth = {};
    trendData.forEach(item => { trendByMonth[item.Month] = item.Percent; });
    chartData = monthsForChart.map(month => ({
      month,
      percent: trendByMonth[month] || 0,
      workDays: 0
    }));
  }

  const donutPercent = selectedEmployee ? employeeMonthly.attendanceRate
    : (chartData.length > 0 ? chartData[chartData.length - 1]?.percent || 0 : 0);

  return (
    <MainLayout title="Quản lý Chấm công" subtitle="Theo dõi tình trạng đi làm, nghỉ phép và vắng mặt của nhân sự">
      {/* Thanh công cụ */}
      <div className="actions-row right" style={{ marginBottom: '16px' }}>
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          <option value="2024-09">Tháng 9/2024</option>
          <option value="2024-10">Tháng 10/2024</option>
          <option value="2024-11">Tháng 11/2024</option>
          <option value="2024-12">Tháng 12/2024</option>
        </select>
        <select value={departmentName} onChange={(e) => setDepartmentName(e.target.value)}>
          <option value="">Tất cả phòng ban</option>
          <option value="Phòng Nhân sự">Phòng Nhân sự</option>
          <option value="Phòng Kỹ thuật">Phòng Kỹ thuật</option>
          <option value="Phòng Kinh doanh">Phòng Kinh doanh</option>
          <option value="Phòng Kế toán">Phòng Kế toán</option>
        </select>
        <input type="text" placeholder="Tìm kiếm nhân viên..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn primary" onClick={handleFilter}>Lọc</button>
        {/* Dropdown Xuất báo cáo */}
        <div style={{ position: 'relative' }} ref={exportMenuRef}>
          <button className="btn blue" style={{ justifyContent: 'space-between' }} onClick={() => setShowExportMenu(!showExportMenu)}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Download size={16} /> Xuất báo cáo</span>
            <ChevronDown size={16} />
          </button>
          {showExportMenu && (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #cdd4e5', borderRadius: '9px', boxShadow: '0 10px 28px rgba(31,41,55,.08)', zIndex: 100, marginTop: '4px', minWidth: '180px' }}>
              <button className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: '9px 9px 0 0' }} onClick={handleExportAll}>Toàn bộ công ty</button>
              <button className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 0 }} onClick={handleExportDepartment}>Phòng ban đã chọn</button>
              <button className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: '0 0 9px 9px' }} onClick={handleExportSelected}>Nhân viên đã chọn</button>
            </div>
          )}
        </div>
      </div>

      {/* Khu vực thống kê + biểu đồ */}
      <div className="grid" style={{ gap: '16px', marginBottom: '16px', gridTemplateColumns: '1fr 1fr' }}>
        <Card style={{ padding: '20px' }}>
          <div className="section-head">
            <h2>Thống kê chuyên cần</h2>
            {selectedEmployee ? <span className="chip blue-bg">{selectedEmployee.FullName}</span>
              : <span className="chip blue-bg">{departmentName ? `Phòng ${departmentName}` : 'Toàn công ty'}</span>}
          </div>

          {/* Biểu đồ xu hướng 6 tháng */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <h4>Xu hướng 6 tháng gần nhất</h4>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', height: '220px', marginTop: '12px' }}>
              {chartData.map((item, idx) => {
                const maxPercent = Math.max(...chartData.map(d => d.percent), 1);
                const heightPercent = (item.percent / maxPercent) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      height: item.percent > 0 ? `${Math.max(heightPercent, 10)}%` : '10%',
                      width: '100%',
                      backgroundColor: item.percent > 0 ? '#1e3a8a' : '#e0f2fe',
                      borderRadius: '4px 4px 0 0',
                      border: item.percent === 0 ? '1px solid #b0c4de' : 'none',
                      transition: 'height 0.3s'
                    }} />
                    <span style={{ fontSize: '11px', marginTop: '6px', color: '#555' }}>{item.month.slice(2)}</span>
                    <span style={{ fontSize: '10px', color: '#888' }}>{item.percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chỉ số */}
          <div className="attendance-metrics" style={{ marginTop: '24px' }}>
            {selectedEmployee ? (
              <>
                <b>{employeeMonthly.workDays}<span>Ngày công</span></b>
                <b>{employeeMonthly.leaveDays}<span>Nghỉ phép</span></b>
                <b className="red-text">{employeeMonthly.absentDays}<span>Vắng</span></b>
              </>
            ) : (
              <b>{donutPercent}%<span>Tỷ lệ chung</span></b>
            )}
          </div>
        </Card>

        {/* Card Đánh giá (biểu đồ tròn) */}
        <Card className="center" style={{ padding: '20px' }}>
          {selectedEmployee || donutPercent > 0 ? (
            <div>
              <h4>Đánh giá</h4>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '20px auto' }}>
                <svg viewBox="0 0 36 36" width="140" height="140">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0f2fe" strokeWidth="3.2" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e3a8a" strokeWidth="3.2"
                    strokeDasharray={`${donutPercent} ${100 - donutPercent}`} strokeDashoffset="0" transform="rotate(-90 18 18)" />
                  <text x="18" y="20" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e3a8a">{donutPercent}%</text>
                </svg>
              </div>
              <p>Tỷ lệ chuyên cần</p>
            </div>
          ) : (
            <p>Chọn nhân viên hoặc phòng ban để xem tỷ lệ</p>
          )}
        </Card>
      </div>

      {/* Bảng danh sách */}
      <Card style={{ padding: '20px' }}>
        <div className="section-head"><h2>Danh sách chấm công chi tiết</h2></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {columns.map(col => <th key={col.key} style={{ padding: '12px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>{col.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {attendanceList.length > 0 ? (
                attendanceList.map((row, idx) => (
                  <tr key={idx} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                        {col.key === 'Status' ? (
                          (() => {
                            let variant = 'green';
                            if (row.Status === 'Nghỉ nhiều') variant = 'orange';
                            if (row.Status === 'Vắng quá hạn') variant = 'red';
                            return statusBadge(row.Status, variant);
                          })()
                        ) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </MainLayout>
  );
}