const API_BASE = '/api/payroll';

// Lấy lương mới nhất của nhân viên
export const getLatestSalary = async (employeeId) => {
  const res = await fetch(`${API_BASE}/${employeeId}/latest-salary`);
  if (!res.ok) throw new Error('Salary not found');
  return res.json();
};

// Lấy lịch sử lương của nhân viên
export const getSalaryHistory = async (employeeId) => {
  const res = await fetch(`${API_BASE}/${employeeId}/salary-history`);
  if (!res.ok) throw new Error('No salary history');
  return res.json();
};

// Lấy chi tiết lương mới nhất (giống latest-salary)
export const getSalaryDetail = async (employeeId) => {
  const res = await fetch(`${API_BASE}/${employeeId}/salary-detail`);
  if (!res.ok) throw new Error('Salary detail not found');
  return res.json();
};

// Lấy điểm danh của nhân viên theo tháng
export const getAttendance = async (employeeId, month) => {
  const res = await fetch(`${API_BASE}/${employeeId}/attendance?month=${encodeURIComponent(month)}`);
  if (!res.ok) throw new Error('Attendance not found');
  return res.json();
};

// Lấy danh sách lương theo tháng (có thể lọc phòng ban)
export const getSalariesByMonth = async (month, departmentName = '') => {
  const params = new URLSearchParams({ month });
  if (departmentName) params.append('department_name', departmentName);
  const res = await fetch(`${API_BASE}/salaries?${params.toString()}`);
  if (!res.ok) throw new Error('No salary data');
  return res.json();
};

// Xuất lịch sử lương của một nhân viên theo năm (file Excel)
export const exportEmployeeSalary = (employeeId, year = null) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  const url = `${API_BASE}/export/${employeeId}?${params.toString()}`;
  window.open(url, '_blank');
};

// Xuất báo cáo tổng hợp cho một nhân viên (cả lương + điểm danh)
export const exportFullEmployeeReport = (employeeId, month) => {
  const params = new URLSearchParams({ month });
  const url = `${API_BASE}/export-full/${employeeId}?${params.toString()}`;
  window.open(url, '_blank');
};

// Lấy danh sách phòng ban
export const getDepartments = async () => {
  const res = await fetch(`${API_BASE}/departments`);
  if (!res.ok) throw new Error('Cannot fetch departments');
  return res.json();
};

// Cập nhật lương và phòng ban cho nhân viên trong tháng
export const updateSalary = async (data) => {
  const res = await fetch(`${API_BASE}/update-salary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
};

// Xoá toàn bộ dữ liệu lương, điểm danh, thông tin nhân viên trong DB payroll
export const deleteEmployee = async (employeeId) => {
  const res = await fetch(`${API_BASE}/delete-employee/${employeeId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
};

// Lấy dữ liệu xu hướng tổng lương 6 tháng (toàn công ty hoặc phòng ban)
export const getSalaryTrend = async (months = 6, referenceMonth, departmentName = '') => {
  const params = new URLSearchParams({ months, reference_month: referenceMonth });
  if (departmentName) params.append('department_name', departmentName);
  const res = await fetch(`${API_BASE}/salary-trend?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch trend');
  return res.json();
};

// Xuất báo cáo Excel toàn bộ nhân viên trong tháng
export const exportAllEmployeesExcel = (month) => {
  const params = new URLSearchParams({ month });
  const url = `${API_BASE}/export-all?${params.toString()}`;
  window.open(url, '_blank');
};

// Xuất báo cáo Excel của một phòng ban trong tháng
export const exportByDepartmentExcel = (month, departmentName) => {
  const params = new URLSearchParams({ month, department_name: departmentName });
  const url = `${API_BASE}/export-by-department?${params.toString()}`;
  window.open(url, '_blank');
};