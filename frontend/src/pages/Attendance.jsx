import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import { statusBadge } from '../components/ui/Table.jsx';
import {
  getAttendanceList,
  getAttendanceStats,
  exportAttendanceExcel,
  getEmployeeAttendanceHistory
} from '../services/attendanceService';

// Hàm tính số ngày trong tháng (yyyy-mm)
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
    workDays: 0,
    leaveDays: 0,
    absentDays: 0,
    attendanceRate: 0
  });

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
  };

  const handleExport = () => {
    exportAttendanceExcel(selectedMonth);
  };

  useEffect(() => {
    fetchAttendanceList();
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

  // Chuẩn bị danh sách 6 tháng gần nhất (từ selectedMonth lùi về trước)
  const monthsForChart = [];
  const [year, monthNum] = selectedMonth.split('-').map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, monthNum - 1 - i, 1);
    const label = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    monthsForChart.push(label);
  }

  // Tính dữ liệu cho biểu đồ cột (tỉ lệ %)
  const chartData = monthsForChart.map(month => {
    // Nếu là tháng đang chọn, ưu tiên dùng dữ liệu từ dòng nhân viên đã chọn
    const currentMonthData = (selectedEmployee && month === selectedMonth)
      ? { WorkDays: selectedEmployee.WorkDays }
      : null;

    const rec = currentMonthData || historyData.find(r => r.AttendanceMonth === month);
    const totalDays = daysInMonth(month);
    if (!rec || totalDays === 0) return { month, percent: 0, workDays: 0 };
    const percent = Math.round((rec.WorkDays / totalDays) * 100);
    return { month, percent, workDays: rec.WorkDays };
  });

  // Dữ liệu cho biểu đồ tròn
  const monthDays = daysInMonth(selectedMonth);
  const donutPercent = employeeMonthly.attendanceRate;

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
        <input
          type="text"
          placeholder="Tìm kiếm nhân viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn primary" onClick={handleFilter}>Lọc</button>
        <button className="btn blue" onClick={handleExport}><Download size={16} /> Xuất báo cáo</button>
      </div>

      {/* Khu vực thống kê + biểu đồ */}
      <div className="grid" style={{ gap: '16px', marginBottom: '16px', gridTemplateColumns: '1fr 1fr' }}>
        {/* Card Thống kê chuyên cần */}
        <Card style={{ padding: '20px' }}>
          <div className="section-head">
            <h2>Thống kê chuyên cần</h2>
            {selectedEmployee && <span className="chip blue-bg">{selectedEmployee.FullName}</span>}
          </div>

          {/* Biểu đồ xu hướng 6 tháng (tự vẽ) */}
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <h4>Xu hướng 6 tháng gần nhất</h4>
            {selectedEmployee ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', height: '220px', marginTop: '12px' }}>
                {chartData.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{
                      height: item.percent > 0 ? `${Math.max(item.percent, 4)}%` : '4px',
                      width: '100%',
                      backgroundColor: item.percent > 0 ? '#1e3a8a' : '#e0f2fe',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s',
                      border: item.percent === 0 ? '1px solid #b0c4de' : 'none'
                    }} />
                    <span style={{ fontSize: '11px', marginTop: '6px', color: '#555' }}>
                      {item.month.slice(2)} {/* Hiển thị năm-02 ký tự tháng */}
                    </span>
                    <span style={{ fontSize: '10px', color: '#888' }}>{item.percent}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#999' }}>Chọn nhân viên để xem biểu đồ</p>
              </div>
            )}
          </div>

          {/* Các chỉ số ngày công, nghỉ phép, vắng */}
          <div className="attendance-metrics" style={{ marginTop: '24px' }}>
            <b>{employeeMonthly.workDays}<span>Ngày công</span></b>
            <b>{employeeMonthly.leaveDays}<span>Nghỉ phép</span></b>
            <b className="red-text">{employeeMonthly.absentDays}<span>Vắng</span></b>
          </div>
        </Card>

        {/* Card Đánh giá (biểu đồ tròn) */}
        <Card className="center" style={{ padding: '20px' }}>
          {selectedEmployee ? (
            <div>
              <h4>Đánh giá</h4>
              <div style={{ position: 'relative', width: '140px', height: '140px', margin: '20px auto' }}>
                <svg viewBox="0 0 36 36" width="140" height="140">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0f2fe" strokeWidth="3.2" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="3.2"
                    strokeDasharray={`${donutPercent} ${100 - donutPercent}`}
                    strokeDashoffset="0"
                    transform="rotate(-90 18 18)"
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  />
                  <text x="18" y="20" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#1e3a8a">
                    {donutPercent}%
                  </text>
                </svg>
              </div>
              <p>Tỷ lệ chuyên cần</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '180px' }}>
              <p>Chọn nhân viên để xem tỷ lệ</p>
            </div>
          )}
        </Card>
      </div>

      {/* Bảng danh sách nhân viên */}
      <Card style={{ padding: '20px' }}>
        <div className="section-head">
          <h2>Danh sách chấm công chi tiết</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: '12px 10px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceList.length > 0 ? (
                attendanceList.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => handleRowClick(row)}
                    style={{ cursor: 'pointer' }}
                  >
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                        {col.key === 'Status' ? (
                          (() => {
                            let variant = 'green';
                            if (row.Status === 'Nghỉ nhiều') variant = 'orange';
                            if (row.Status === 'Vắng quá hạn') variant = 'red';
                            return statusBadge(row.Status, variant);
                          })()
                        ) : (
                          row[col.key]
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '20px' }}>
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </MainLayout>
  );
}