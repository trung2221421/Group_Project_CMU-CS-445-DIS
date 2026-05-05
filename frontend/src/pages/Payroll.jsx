import { useState, useEffect, useRef } from 'react';
import { Download, Filter, Edit, Trash2, ChevronDown } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import {
  getSalaryHistory,
  getAttendance,
  getSalariesByMonth,
  exportFullEmployeeReport,
  getDepartments,
  updateSalary,
  deleteEmployee,
  getSalaryTrend,
  exportAllEmployeesExcel,
  exportByDepartmentExcel,
} from '../services/payrollService.js';

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState('2024-09');
  const [departmentName, setDepartmentName] = useState('');
  const [searchName, setSearchName] = useState('');

  const [salaryList, setSalaryList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [history, setHistory] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [departments, setDepartments] = useState([]);

  // Popup sửa
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState({
    department_name: '',
    base_salary: 0,
    bonus: 0,
    deductions: 0
  });

  // Dropdown xuất báo cáo
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Dữ liệu tổng lương 6 tháng từ API
  const [trendData, setTrendData] = useState([]);

  // Đóng menu xuất khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSalaryList = async (month, deptName) => {
    setLoading(true);
    try {
      const data = await getSalariesByMonth(month, deptName);
      setSalaryList(data);
    } catch (err) {
      console.error('Lỗi tải danh sách lương:', err);
      setSalaryList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDetail = async (empId) => {
    try {
      const [histRes, attRes] = await Promise.all([
        getSalaryHistory(empId),
        getAttendance(empId, selectedMonth),
      ]);
      setHistory(histRes.salaries || []);
      setAttendance(attRes);
    } catch (err) {
      console.error('Lỗi chi tiết:', err);
      setHistory([]);
      setAttendance(null);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch (err) {
      console.error('Lỗi tải phòng ban:', err);
    }
  };

  const fetchTrend = async () => {
    try {
      const data = await getSalaryTrend(6, selectedMonth, departmentName);
      setTrendData(data || []);
    } catch (err) {
      console.error('Lỗi trend:', err);
      setTrendData([]);
    }
  };

  useEffect(() => {
    fetchSalaryList(selectedMonth, '');
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!selectedEmployeeId) {
      fetchTrend();
    }
  }, [selectedMonth, departmentName, selectedEmployeeId]);

  const handleFilter = () => {
    fetchSalaryList(selectedMonth, departmentName);
  };

  const handleRowClick = (row) => {
    setSelectedEmployeeId(row.EmployeeID);
    setSelectedEmployeeName(row.FullName);
    setSelectedDept(row.DepartmentName);
    fetchEmployeeDetail(row.EmployeeID);
  };

  // --- Xuất báo cáo ---
  const handleExportAll = () => {
    exportAllEmployeesExcel(selectedMonth);
    setShowExportMenu(false);
  };

  const handleExportDepartment = () => {
    if (!departmentName) {
      alert('Vui lòng chọn một phòng ban trước khi xuất.');
      return;
    }
    exportByDepartmentExcel(selectedMonth, departmentName);
    setShowExportMenu(false);
  };

  const handleExportSelected = () => {
    if (!selectedEmployeeId) {
      alert('Vui lòng chọn nhân viên trước khi xuất báo cáo.');
      return;
    }
    exportFullEmployeeReport(selectedEmployeeId, selectedMonth);
    setShowExportMenu(false);
  };

  // --- Sửa ---
  const handleEditClick = () => {
    if (!selectedEmployeeId) {
      alert('Chọn nhân viên trước.');
      return;
    }
    const currentSalary = history.find(item => item.SalaryMonth === selectedMonth);
    if (!currentSalary) {
      alert('Không có dữ liệu lương tháng này để sửa.');
      return;
    }
    setEditData({
      department_name: selectedDept,
      base_salary: currentSalary.BaseSalary,
      bonus: currentSalary.Bonus,
      deductions: currentSalary.Deductions
    });
    setShowEditPopup(true);
  };

  const handleSaveEdit = async () => {
    try {
      await updateSalary({
        employee_id: selectedEmployeeId,
        month: selectedMonth,
        base_salary: editData.base_salary,
        bonus: editData.bonus,
        deductions: editData.deductions,
        department_name: editData.department_name
      });
      setShowEditPopup(false);
      fetchEmployeeDetail(selectedEmployeeId);
      fetchSalaryList(selectedMonth, departmentName);
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
      alert('Cập nhật thất bại.');
    }
  };

  // --- Xóa ---
  const handleDeleteClick = () => {
    if (!selectedEmployeeId) {
      alert('Chọn nhân viên trước.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xoá toàn bộ dữ liệu của nhân viên này?')) {
      deleteEmployee(selectedEmployeeId)
        .then(() => {
          alert('Đã xoá.');
          setSalaryList(prev => prev.filter(e => e.EmployeeID !== selectedEmployeeId));
          setSelectedEmployeeId(null);
          setSelectedEmployeeName('');
          setSelectedDept('');
          setHistory([]);
          setAttendance(null);
        })
        .catch(err => {
          console.error('Lỗi xoá:', err);
          alert('Xoá thất bại.');
        });
    }
  };

  const filteredList = salaryList.filter((row) =>
    row.FullName.toLowerCase().includes(searchName.toLowerCase())
  );

  const columns = [
    { key: 'EmployeeID', label: 'Mã NV' },
    { key: 'FullName', label: 'Họ tên' },
    { key: 'DepartmentName', label: 'Phòng ban' },
    { key: 'BaseSalary', label: 'Lương cơ bản', format: (v) => v.toLocaleString() + ' đ' },
    { key: 'Bonus', label: 'Thưởng', format: (v) => v.toLocaleString() + ' đ' },
    { key: 'Deductions', label: 'Khấu trừ', format: (v) => v.toLocaleString() + ' đ' },
    { key: 'NetSalary', label: 'Thực nhận', format: (v) => v.toLocaleString() + ' đ' },
    { key: 'SalaryMonth', label: 'Tháng' },
  ];

  const totalBase = filteredList.reduce((s, r) => s + r.BaseSalary, 0);
  const totalBonus = filteredList.reduce((s, r) => s + r.Bonus, 0);
  const totalDeduct = filteredList.reduce((s, r) => s + r.Deductions, 0);
  const totalNet = filteredList.reduce((s, r) => s + r.NetSalary, 0);

  // --- Dữ liệu biểu đồ ---
  const monthsForChart = [];
  const [year, monthNum] = selectedMonth.split('-').map(Number);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, monthNum - 1 - i, 1);
    const label = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    monthsForChart.push(label);
  }

  let chartData = [];
  if (selectedEmployeeId) {
    // Cá nhân
    const salaryByMonth = {};
    history.forEach(item => { salaryByMonth[item.SalaryMonth] = item.NetSalary; });
    chartData = monthsForChart.map(m => (salaryByMonth[m] || 0) / 1_000_000);
  } else {
    // Tổng quan (toàn công ty hoặc phòng ban)
    if (trendData.length > 0) {
      const trendByMonth = {};
      trendData.forEach(item => { trendByMonth[item.Month] = item.TotalNet; });
      chartData = monthsForChart.map(m => (trendByMonth[m] || 0) / 1_000_000);
    } else {
      // Fallback: dùng tổng từ bảng hiện tại
      const fallbackTotal = salaryList.reduce((sum, r) => sum + r.NetSalary, 0) / 1_000_000;
      chartData = monthsForChart.map(m => (m === selectedMonth ? fallbackTotal : 0));
    }
  }

  const recentSalaries = history.slice(0, 6);

  // --- Biểu đồ cột ---
  // Hàm render biểu đồ cột (đã sửa lỗi không hiển thị)
const renderBarChart = (data, months) => {
  const maxVal = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', height: '220px', marginTop: '12px' }}>
      {data.length > 0 ? (
        data.map((val, idx) => {
          const heightPercent = (val / maxVal) * 100;
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40px', height: '100%', justifyContent: 'flex-end' }}>
              <div style={{
                height: `${Math.max(heightPercent, 10)}%`,
                width: '100%',
                backgroundColor: val > 0 ? '#1e3a8a' : '#e0f2fe',
                borderRadius: '4px 4px 0 0',
                border: val === 0 ? '1px solid #b0c4de' : 'none',
                transition: 'height 0.3s'
              }} />
              <span style={{ fontSize: '11px', marginTop: '6px', color: '#555' }}>
                {months[idx]?.slice(2) || ''}
              </span>
            </div>
          );
        })
      ) : (
        <p style={{ color: '#999' }}>Không có dữ liệu</p>
      )}
    </div>
  );
};
  return (
    <MainLayout title="Quản lý lương & Payroll">
      <div className="split payroll-split">
        <div className="stack">
          {/* Thanh công cụ */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>CHỌN THÁNG</span>
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: '100%' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>PHÒNG BAN</span>
                <select value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} style={{ width: '100%' }}>
                  <option value="">Tất cả phòng ban</option>
                  {departments.map((dept, i) => (
                    <option key={i} value={dept.DepartmentName}>{dept.DepartmentName}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>TÌM KIẾM NHÂN VIÊN</span>
                <input placeholder="Nhập tên nhân viên..." value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ width: '100%' }} />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn primary" style={{ width: '100%' }} onClick={handleFilter}>
                <Filter /> Lọc dữ liệu
              </button>
              {/* Dropdown Xuất báo cáo */}
              <div style={{ position: 'relative' }} ref={exportMenuRef}>
                <button
                  className="btn blue"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Download size={16} /> Xuất báo cáo
                  </span>
                  <ChevronDown size={16} />
                </button>
                {showExportMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #cdd4e5',
                    borderRadius: '9px',
                    boxShadow: '0 10px 28px rgba(31,41,55,.08)',
                    zIndex: 100,
                    marginTop: '4px'
                  }}>
                    <button className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: '9px 9px 0 0' }} onClick={handleExportAll}>
                      Toàn bộ công ty
                    </button>
                    <button className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: 0 }} onClick={handleExportDepartment}>
                      Phòng ban đã chọn
                    </button>
                    <button className="btn ghost" style={{ width: '100%', justifyContent: 'flex-start', border: 'none', borderRadius: '0 0 9px 9px' }} onClick={handleExportSelected}>
                      Nhân viên đã chọn
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="stats-grid four">
            <StatCard label="Tổng lương cơ bản" value={`${totalBase.toLocaleString()} đ`} />
            <StatCard label="Tổng thưởng" value={`${totalBonus.toLocaleString()} đ`} />
            <StatCard label="Tổng khấu trừ" value={`${totalDeduct.toLocaleString()} đ`} tone="red" />
            <StatCard label="Tổng thực nhận" value={`${totalNet.toLocaleString()} đ`} tone="green" />
          </div>

          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map(col => <th key={col.key}>{col.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredList.length > 0 ? (
                    filteredList.map((row, idx) => (
                      <tr key={idx} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                        {columns.map(col => (
                          <td key={col.key}>
                            {col.format ? col.format(row[col.key]) : row[col.key]}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={columns.length} style={{ textAlign: 'center' }}>Không có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar chi tiết */}
        <Card className="side-history">
          {selectedEmployeeId ? (
            <>
              <h2>Lịch sử lương</h2>
              <div className="person-card">
                👨🏻‍💼
                <div>
                  <h3>{selectedEmployeeName}</h3>
                  <p>{selectedDept}</p>
                </div>
              </div>

              <h4>Xu hướng 6 tháng gần nhất</h4>
              {renderBarChart(chartData, monthsForChart)}

              <h4>Điểm danh tháng {selectedMonth}</h4>
              <div className="attendance-box">
                {attendance ? (
                  <div className="attendance-grid">
                    <div className="att-item"><span className="att-label">Ngày làm</span><span className="att-value">{attendance.WorkDays}</span></div>
                    <div className="att-item"><span className="att-label">Ngày nghỉ</span><span className="att-value">{attendance.LeaveDays}</span></div>
                    <div className="att-item"><span className="att-label">Vắng</span><span className="att-value">{attendance.AbsentDays}</span></div>
                  </div>
                ) : <p>Chưa có dữ liệu điểm danh</p>}
              </div>

              <h4>Lương các tháng gần đây</h4>
              {recentSalaries.length > 0 ? (
                recentSalaries.map((item, idx) => (
                  <div className="history-item" key={idx}>
                    <b>Tháng {item.SalaryMonth}</b>
                    <span>{item.NetSalary.toLocaleString()} đ</span>
                  </div>
                ))
              ) : <p>Không có dữ liệu</p>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <button className="btn primary" style={{ flex: 1 }} onClick={handleEditClick}><Edit size={16} /> Sửa</button>
                <button className="btn red" style={{ flex: 1 }} onClick={handleDeleteClick}><Trash2 size={16} /> Xóa</button>
              </div>
            </>
          ) : (
            <>
              <h2>Tổng quan lương</h2>
              <p>{departmentName ? `Phòng ${departmentName}` : 'Toàn công ty'}</p>
              <h4>Xu hướng 6 tháng gần nhất</h4>
              {renderBarChart(chartData, monthsForChart)}
              <p>Chọn một nhân viên trong bảng để xem chi tiết.</p>
            </>
          )}
        </Card>
      </div>

      {/* Popup sửa */}
      {showEditPopup && (
        <div className="popup-overlay" onClick={() => setShowEditPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Sửa thông tin lương tháng {selectedMonth}</h3>
            <label>Phòng ban:
              <select value={editData.department_name} onChange={e => setEditData({...editData, department_name: e.target.value})}>
                {departments.map((dept, i) => (
                  <option key={i} value={dept.DepartmentName}>{dept.DepartmentName}</option>
                ))}
              </select>
            </label>
            <label>Lương cơ bản:
              <input type="number" value={editData.base_salary} onChange={e => setEditData({...editData, base_salary: +e.target.value})} />
            </label>
            <label>Thưởng:
              <input type="number" value={editData.bonus} onChange={e => setEditData({...editData, bonus: +e.target.value})} />
            </label>
            <label>Khấu trừ:
              <input type="number" value={editData.deductions} onChange={e => setEditData({...editData, deductions: +e.target.value})} />
            </label>
            <p><strong>Thực nhận:</strong> {(editData.base_salary + editData.bonus - editData.deductions).toLocaleString()} đ</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button className="btn" onClick={() => setShowEditPopup(false)}>Huỷ</button>
              <button className="btn primary" onClick={handleSaveEdit}>Lưu</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}