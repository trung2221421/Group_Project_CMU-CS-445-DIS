import { useState, useEffect } from 'react';
import { Download, Filter, Edit, Trash2 } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import {
  getSalaryHistory,
  getAttendance,
  getSalariesByMonth,
  exportFullEmployeeReport,
  getDepartments,
  updateSalary,
  deleteEmployee
} from '../services/payrollService';

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

  // State cho popup sửa
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editData, setEditData] = useState({
    department_name: '',
    base_salary: 0,
    bonus: 0,
    deductions: 0
  });

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

  useEffect(() => {
    fetchSalaryList(selectedMonth, '');
    loadDepartments();
  }, []);

  const handleFilter = () => {
    fetchSalaryList(selectedMonth, departmentName);
  };

  const handleRowClick = (row) => {
    setSelectedEmployeeId(row.EmployeeID);
    setSelectedEmployeeName(row.FullName);
    setSelectedDept(row.DepartmentName);
    fetchEmployeeDetail(row.EmployeeID);
  };

  const handleExport = () => {
    if (!selectedEmployeeId) {
      alert('Vui lòng chọn nhân viên trước khi xuất báo cáo.');
      return;
    }
    exportFullEmployeeReport(selectedEmployeeId, selectedMonth);
  };

  // Mở popup sửa
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

  // Xử lý lưu sửa
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

  // Xác nhận xoá
  const handleDeleteClick = () => {
    if (!selectedEmployeeId) {
      alert('Chọn nhân viên trước.');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xoá toàn bộ dữ liệu của nhân viên này trong hệ thống Payroll? Hành động này không thể hoàn tác.')) {
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

  // Chuẩn bị dữ liệu biểu đồ 6 tháng, tháng trống = 0
  const months = [];
  const [year, monthNum] = selectedMonth.split('-').map(Number);
  for (let i = 0; i < 6; i++) {
    const d = new Date(year, monthNum - 1 - i, 1);
    const label = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    months.unshift(label);
  }
  const salaryByMonth = {};
  history.forEach(item => {
    salaryByMonth[item.SalaryMonth] = item.NetSalary;
  });
  const chartData = months.map(m => (salaryByMonth[m] || 0) / 1_000_000);

  // Lương 6 tháng gần nhất (chỉ những tháng có dữ liệu)
  const recentSalaries = history.slice(0, 6);

  return (
    <MainLayout title="Quản lý lương & Payroll">
      <div className="split payroll-split">
        <div className="stack">
          {/* ====== THANH CÔNG CỤ DẠNG CỘT ====== */}
          <Card style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>CHỌN THÁNG</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>PHÒNG BAN</span>
                <select
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="">Tất cả phòng ban</option>
                  {departments.map((dept, i) => (
                    <option key={i} value={dept.DepartmentName}>{dept.DepartmentName}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>TÌM KIẾM NHÂN VIÊN</span>
                <input
                  placeholder="Nhập tên nhân viên..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn primary" style={{ width: '100%' }} onClick={handleFilter}>
                <Filter /> Lọc dữ liệu
              </button>
              <button className="btn blue" style={{ width: '100%' }} onClick={handleExport}>
                <Download /> Xuất báo cáo
              </button>
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

        {/* Sidebar chi tiết nhân viên */}
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
              <BarChart values={chartData} />

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
            <p>Click vào một nhân viên trong bảng để xem chi tiết</p>
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