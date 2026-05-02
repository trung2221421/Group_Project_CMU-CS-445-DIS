import { FileUp } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import EmployeeForm, { EmployeeExtraCards } from '../components/forms/EmployeeForm.jsx';

export default function EmployeeFormPage() {
  return (
    <MainLayout title="Thêm / Chỉnh sửa nhân viên">
      <div className="success-banner">✓ Lưu và đồng bộ nhân viên thành công! <button>×</button></div>
      <div className="section-head page-title"><div><h2>Thêm / Chỉnh sửa nhân viên</h2><p>Vui lòng nhập đầy đủ thông tin để đảm bảo quyền lợi và bảo hiểm của nhân viên.</p></div><button className="btn ghost"><FileUp size={17}/> Nhập từ Excel</button></div>
      <EmployeeForm />
      <EmployeeExtraCards />
    </MainLayout>
  );
}
