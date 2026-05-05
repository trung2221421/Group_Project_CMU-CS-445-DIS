const API_BASE = '/api/payroll';

export const getLatestSalary = async (employeeId) => {
  const res = await fetch(`${API_BASE}/${employeeId}/latest-salary`);
  if (!res.ok) throw new Error('Salary not found');
  return res.json();
};

export const getSalaryHistory = async (employeeId) => {
  const res = await fetch(`${API_BASE}/${employeeId}/salary-history`);
  if (!res.ok) throw new Error('No salary history');
  return res.json();
};

export const getSalaryDetail = async (employeeId) => {
  const res = await fetch(`${API_BASE}/${employeeId}/salary-detail`);
  if (!res.ok) throw new Error('Salary detail not found');
  return res.json();
};

export const getAttendance = async (employeeId, month) => {
  const res = await fetch(`${API_BASE}/${employeeId}/attendance?month=${month}`);
  if (!res.ok) throw new Error('Attendance not found');
  return res.json();
};

export const getSalariesByMonth = async (month, departmentName = '') => {
  const params = new URLSearchParams({ month });
  if (departmentName) params.append('department_name', departmentName);
  const res = await fetch(`${API_BASE}/salaries?${params.toString()}`);
  if (!res.ok) throw new Error('No salary data');
  return res.json();
};

// Xuất lịch sử lương theo năm (giữ lại)
export const exportEmployeeSalary = (employeeId, year = null) => {
  const params = new URLSearchParams();
  if (year) params.append('year', year);
  const url = `${API_BASE}/export/${employeeId}?${params.toString()}`;
  window.open(url, '_blank');
};

// MỚI: Xuất báo cáo tổng hợp (toàn bộ thông tin)
export const exportFullEmployeeReport = (employeeId, month) => {
  const params = new URLSearchParams({ month });
  const url = `${API_BASE}/export-full/${employeeId}?${params.toString()}`;
  window.open(url, '_blank');
};
export const getDepartments = async () => {
  const res = await fetch(`${API_BASE}/departments`);
  if (!res.ok) throw new Error('Cannot fetch departments');
  return res.json();
};

// Cập nhật lương và phòng ban
export const updateSalary = async (data) => {
  const res = await fetch(`${API_BASE}/update-salary`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Update failed');
  return res.json();
};

// Xoá dữ liệu nhân viên
export const deleteEmployee = async (employeeId) => {
  const res = await fetch(`${API_BASE}/delete-employee/${employeeId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Delete failed');
  return res.json();
};

