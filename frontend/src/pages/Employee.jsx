
import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FileUp, X } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import EmployeeForm, { EmployeeExtraCards } from '../components/forms/EmployeeForm.jsx';
import {  getEmployees, getFilters  } from '../services/employeesService';
import { createEmployee, updateEmployee } from '../services/employeeService';

export default function EmployeeFormPage() {
  const { id } = useParams();   // Nếu có id => edit mode
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (formData) => {
    if (id) {
      await updateEmployee(id, formData);
      setSuccessMsg('Cập nhật nhân viên thành công!');
    } else {
      await createEmployee(formData);
      setSuccessMsg('Tạo mới nhân viên thành công!');
      // Sau khi tạo xong có thể reset form hoặc chuyển hướng
      setTimeout(() => navigate('/employees'), 1500);
    }
  };

  return (
    <MainLayout title={id ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}>
      {successMsg && (
        <div className="success-banner">
          ✓ {successMsg} <button onClick={() => setSuccessMsg('')}><X size={16} /></button>
        </div>
      )}

      <div className="section-head page-title">
        <div>
          <h2>{id ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</h2>
          <p>Vui lòng nhập đầy đủ thông tin để đảm bảo quyền lợi và bảo hiểm của nhân viên.</p>
        </div>
        <button className="btn ghost"><FileUp size={17}/> Nhập từ Excel</button>
      </div>

      <EmployeeForm onSubmit={handleSubmit} />

      {!id && <EmployeeExtraCards />}
    </MainLayout>
  );
}
