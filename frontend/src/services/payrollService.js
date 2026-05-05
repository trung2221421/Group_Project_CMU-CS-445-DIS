const API_ROOT = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
const API_BASE = `${API_ROOT}/api/payroll`;

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

async function apiGet(path, fallbackMessage = 'Không tải được dữ liệu Payroll') {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  });

  return parseJsonResponse(res, fallbackMessage);
}

async function apiSend(path, method, body, fallbackMessage = 'Thao tác Payroll thất bại') {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
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

// Lấy lương mới nhất của nhân viên
export const getLatestSalary = async (employeeId) => {
  return apiGet(`/${employeeId}/latest-salary`, 'Salary not found');
};

// Lấy lịch sử lương của nhân viên
export const getSalaryHistory = async (employeeId) => {
  return apiGet(`/${employeeId}/salary-history`, 'No salary history');
};

// Lấy chi tiết lương mới nhất
export const getSalaryDetail = async (employeeId) => {
  return apiGet(`/${employeeId}/salary-detail`, 'Salary detail not found');
};

// Lấy điểm danh của nhân viên theo tháng từ module payroll
export const getAttendance = async (employeeId, month) => {
  const params = new URLSearchParams({ month });
  return apiGet(`/${employeeId}/attendance?${params.toString()}`, 'Attendance not found');
};

// Lấy danh sách lương theo tháng, có thể lọc phòng ban
export const getSalariesByMonth = async (month, departmentName = '') => {
  const params = new URLSearchParams({ month });

  if (departmentName) {
    params.append('department_name', departmentName);
  }

  return apiGet(`/salaries?${params.toString()}`, 'No salary data');
};

// Lấy danh sách phòng ban
export const getDepartments = async () => {
  return apiGet('/departments', 'Cannot fetch departments');
};

// Lấy dữ liệu xu hướng tổng lương 6 tháng
export const getSalaryTrend = async (months = 6, referenceMonth, departmentName = '') => {
  const params = new URLSearchParams({
    months: String(months),
  });

  if (referenceMonth) {
    params.append('reference_month', referenceMonth);
  }

  if (departmentName) {
    params.append('department_name', departmentName);
  }

  return apiGet(`/salary-trend?${params.toString()}`, 'Failed to fetch salary trend');
};

// Cập nhật lương và phòng ban cho nhân viên trong tháng
export const updateSalary = async (data) => {
  return apiSend('/update-salary', 'PUT', data, 'Update failed');
};

// Xoá dữ liệu lương/chấm công/thông tin nhân viên trong DB payroll
export const deleteEmployee = async (employeeId) => {
  const res = await fetch(`${API_BASE}/delete-employee/${employeeId}`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  return parseJsonResponse(res, 'Delete failed');
};

// Xuất lịch sử lương của một nhân viên theo năm
export const exportEmployeeSalary = async (employeeId, year = null) => {
  const params = new URLSearchParams();

  if (year) {
    params.append('year', year);
  }

  const query = params.toString();

  return downloadFile(
    `/export/${employeeId}${query ? `?${query}` : ''}`,
    `salary_history_${employeeId}_${year || 'all'}.xlsx`
  );
};

// Xuất báo cáo tổng hợp cho một nhân viên
export const exportFullEmployeeReport = async (employeeId, month) => {
  const params = new URLSearchParams({ month });

  return downloadFile(
    `/export-full/${employeeId}?${params.toString()}`,
    `employee_report_${employeeId}_${month}.xlsx`
  );
};

// Xuất báo cáo Excel toàn bộ nhân viên trong tháng
export const exportAllEmployeesExcel = async (month) => {
  const params = new URLSearchParams({ month });

  return downloadFile(
    `/export-all?${params.toString()}`,
    `all_employees_${month}.xlsx`
  );
};

// Xuất báo cáo Excel của một phòng ban trong tháng
export const exportByDepartmentExcel = async (month, departmentName) => {
  const params = new URLSearchParams({
    month,
    department_name: departmentName,
  });

  return downloadFile(
    `/export-by-department?${params.toString()}`,
    `department_${departmentName}_${month}.xlsx`
  );
};