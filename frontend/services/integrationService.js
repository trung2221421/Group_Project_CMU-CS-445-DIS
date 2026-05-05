// frontend/src/services/integrationService.js
const API_BASE = '/api/integration';

export const integrationService = {
  async getStatus() {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
    
  },
  async syncSingleEmployee(empId) {
    const response = await fetch(`${API_BASE}/sync/employee/${empId}`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || 'Lỗi đồng bộ');
    return data;
  },

  async getLogs(limit = 50) {
    const response = await fetch(`${API_BASE}/logs?limit=${limit}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async sync(type) {
    const response = await fetch(`${API_BASE}/sync/${type}`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || data.message || 'Lỗi đồng bộ');
    return data;
  },

  async syncAll() {
    return this.sync('all');
  },

  async syncDepartments() {
    return this.sync('departments');
  },

  async syncPositions() {
    return this.sync('positions');
  },

  async syncEmployees() {
    return this.sync('employees');
  },
  async getEmployeeComparison() {
    const res = await fetch(`${API_BASE}/compare/employees`);
    if (!res.ok) throw new Error('Lỗi lấy danh sách nhân viên');
    return res.json();
  },
  async getDepartmentComparison() {
    const res = await fetch(`${API_BASE}/compare/departments`);
    if (!res.ok) throw new Error('Lỗi lấy danh sách phòng ban');
    return res.json();
  },
  async getPositionComparison() {
    const res = await fetch(`${API_BASE}/compare/positions`);
    if (!res.ok) throw new Error('Lỗi lấy danh sách chức vụ');
    return res.json();
  },
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Lỗi lấy thống kê');
    return res.json();
  }
};