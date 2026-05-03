// src/services/employeeService.js
const API_URL = "http://localhost:8000/api";

/**
 * Tạo mới nhân viên
 * @param {Object} employeeData - Dữ liệu nhân viên theo schema
 * @returns {Promise<Object>} - Phản hồi từ server (thường chứa id và message)
 */
export const createEmployee = async (employeeData) => {
  const res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Tạo mới thất bại');
  }
  return res.json();
};

/**
 * Cập nhật thông tin nhân viên
 * @param {number|string} id - ID nhân viên
 * @param {Object} employeeData - Dữ liệu cập nhật (chỉ gửi các trường thay đổi)
 * @returns {Promise<Object>} - Phản hồi từ server
 */
export const updateEmployee = async (id, employeeData) => {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Cập nhật thất bại');
  }
  return res.json();
};

/**
 * Lấy thông tin chi tiết một nhân viên (nếu cần)
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export const getEmployeeById = async (id) => {
  const res = await fetch(`${API_URL}/employees/${id}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Không tìm thấy nhân viên');
  }
  return res.json();
};