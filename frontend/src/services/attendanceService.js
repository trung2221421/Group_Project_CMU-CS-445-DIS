const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_BASE = `${API_ROOT}/api/attendance`;

const getToken = () => {
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    sessionStorage.getItem('accessToken') ||
    sessionStorage.getItem('token')
  );
};

const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function parseJsonResponse(res, fallbackMessage = 'Request failed') {
  const text = await res.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        `API không trả JSON. URL: ${res.url}. HTTP ${res.status}. Response: ${text.slice(0, 200)}`
      );
    }
  }

  if (!res.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || JSON.stringify(item)).join('; ')
      : detail || data?.message || fallbackMessage;

    throw new Error(`${message} (${res.status})`);
  }

  return data;
}

async function apiGet(path, fallbackMessage = 'Không tải được dữ liệu chấm công') {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  });

  return parseJsonResponse(res, fallbackMessage);
}

async function downloadFile(path, defaultFileName) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Xuất báo cáo thất bại. HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';

  let fileName = defaultFileName;
  const fileNameStarMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  const fileNameMatch = disposition.match(/filename="?([^"]+)"?/i);

  if (fileNameStarMatch?.[1]) {
    fileName = decodeURIComponent(fileNameStarMatch[1]);
  } else if (fileNameMatch?.[1]) {
    fileName = fileNameMatch[1];
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);

  return true;
}

// Lấy điểm danh của một nhân viên trong tháng
export const getAttendance = async (employeeId, month) => {
  const params = new URLSearchParams({ month });
  return apiGet(`/${employeeId}?${params.toString()}`, 'Attendance not found');
};

// Lấy danh sách chấm công theo tháng
export const getAttendanceList = async (month, departmentName = '', search = '') => {
  const params = new URLSearchParams({ month });

  if (departmentName) {
    params.append('department_name', departmentName);
  }

  if (search) {
    params.append('search', search);
  }

  return apiGet(`/list?${params.toString()}`, 'No attendance data');
};

// Lấy thống kê tổng chấm công trong tháng
export const getAttendanceStats = async (month) => {
  const params = new URLSearchParams({ month });
  return apiGet(`/stats?${params.toString()}`, 'No attendance stats');
};

// Lấy lịch sử chấm công của một nhân viên
export const getEmployeeAttendanceHistory = async (employeeId, months = 6) => {
  const params = new URLSearchParams({
    months: String(months),
  });

  return apiGet(`/history/${employeeId}?${params.toString()}`, 'No attendance history');
};

// Lấy xu hướng chuyên cần toàn công ty
export const getCompanyAttendanceTrend = async (months = 6, referenceMonth = '') => {
  const params = new URLSearchParams({
    months: String(months),
  });

  if (referenceMonth) {
    params.append('reference_month', referenceMonth);
  }

  return apiGet(`/company-trend?${params.toString()}`, 'Failed to fetch company attendance trend');
};

// Lấy xu hướng chuyên cần theo phòng ban
export const getDepartmentAttendanceTrend = async (months = 6, referenceMonth = '', departmentName = '') => {
  const params = new URLSearchParams({
    months: String(months),
  });

  if (referenceMonth) {
    params.append('reference_month', referenceMonth);
  }

  if (departmentName) {
    params.append('department_name', departmentName);
  }

  return apiGet(`/department-trend?${params.toString()}`, 'Failed to fetch department attendance trend');
};

// Xuất chấm công, có thể truyền tháng hoặc không
export const exportAttendanceExcel = async (month = null) => {
  const params = new URLSearchParams();

  if (month) {
    params.append('month', month);
  }

  const query = params.toString();

  return downloadFile(
    `/export${query ? `?${query}` : ''}`,
    `attendance_${month || 'all'}.xlsx`
  );
};

// Xuất chấm công toàn công ty trong tháng
export const exportAllAttendanceExcel = async (month) => {
  const params = new URLSearchParams({ month });

  return downloadFile(
    `/export-all?${params.toString()}`,
    `attendance_all_${month}.xlsx`
  );
};

// Xuất chấm công theo phòng ban trong tháng
export const exportDepartmentAttendanceExcel = async (month, departmentName) => {
  const params = new URLSearchParams({
    month,
    department_name: departmentName,
  });

  return downloadFile(
    `/export-department?${params.toString()}`,
    `attendance_dept_${departmentName}_${month}.xlsx`
  );
};