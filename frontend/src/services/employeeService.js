import { CURRENT_USER } from './config.js';

const API_URL = "http://localhost:8000/api";

export const createEmployee = async (employeeData) => {
  const res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User': CURRENT_USER,
    },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Tạo mới thất bại');
  }
  return res.json();
};

export const updateEmployee = async (id, employeeData) => {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-User': CURRENT_USER,
    },
    body: JSON.stringify(employeeData),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Cập nhật thất bại');
  }
  return res.json();
};

export const getEmployeeById = async (id) => {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    headers: { 'X-User': CURRENT_USER }
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Không tìm thấy nhân viên');
  }
  return res.json();
};
export const deleteEmployee = async (id) => {
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'DELETE',
    headers: {
      'X-User': CURRENT_USER,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Xóa thất bại');
  }
  return res.json();
}