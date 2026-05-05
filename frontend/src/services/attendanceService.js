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