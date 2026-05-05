const API_BASE = '/api/attendance';

export const getAttendance = async (employeeId, month) => {
  const res = await fetch(`${API_BASE}/${employeeId}?month=${month}`);
  if (!res.ok) throw new Error('Attendance not found');
  return res.json();
};

export const getAttendanceList = async (month, departmentName = '', search = '') => {
  const params = new URLSearchParams({ month });
  if (departmentName) params.append('department_name', departmentName);
  if (search) params.append('search', search);
  const url = `${API_BASE}/list?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('No attendance data');
  return res.json();
};

export const getAttendanceStats = async (month) => {
  const res = await fetch(`${API_BASE}/stats?month=${month}`);
  if (!res.ok) throw new Error('No attendance stats');
  return res.json();
};

export const exportAttendanceExcel = (month = null) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  const url = `${API_BASE}/export?${params.toString()}`;
  window.open(url, '_blank');
};

export const getEmployeeAttendanceHistory = async (employeeId, months = 6) => {
  const res = await fetch(`/api/attendance/history/${employeeId}?months=${months}`);
  if (!res.ok) throw new Error('No attendance history');
  return res.json();
};

// Lấy xu hướng chuyên cần toàn công ty (6 tháng)
export const getCompanyAttendanceTrend = async (months = 6, referenceMonth) => {
  const params = new URLSearchParams({ months, reference_month: referenceMonth });
  const res = await fetch(`/api/attendance/company-trend?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch company trend');
  return res.json();
};

// Lấy xu hướng chuyên cần theo phòng ban (6 tháng)
export const getDepartmentAttendanceTrend = async (months = 6, referenceMonth, departmentName) => {
  const params = new URLSearchParams({ months, reference_month: referenceMonth, department_name: departmentName });
  const res = await fetch(`/api/attendance/department-trend?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch department trend');
  return res.json();
};

// Xuất toàn bộ điểm danh công ty theo tháng
export const exportAllAttendanceExcel = (month) => {
  const url = `/api/attendance/export-all?month=${encodeURIComponent(month)}`;
  window.open(url, '_blank');
};

// Xuất điểm danh phòng ban theo tháng
export const exportDepartmentAttendanceExcel = (month, departmentName) => {
  const url = `/api/attendance/export-department?month=${encodeURIComponent(month)}&department_name=${encodeURIComponent(departmentName)}`;
  window.open(url, '_blank');
};