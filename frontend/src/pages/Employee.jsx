// src/pages/Employee.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FileUp, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import MainLayout from '../layout/MainLayout.jsx';
import EmployeeForm, { EmployeeExtraCards } from '../components/forms/EmployeeForm.jsx';
import { createEmployee, updateEmployee, getEmployeeById } from '../services/employeeService';

const formatDate = (value) => {
  if (!value) return '';
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  return value;
};

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);
  const [employee, setEmployee] = useState(null);

  // Khi có id (chỉnh sửa), tải dữ liệu nhân viên
  useEffect(() => {
    if (id) {
      getEmployeeById(id)
        .then(data => setEmployee(data))
        .catch(err => {
          console.error('Lỗi tải nhân viên:', err);
          setEmployee(null);
        });
    } else {
      setEmployee(null); // Reset khi thêm mới
    }
  }, [id]);

  const handleSubmit = async (formData) => {
    if (id) {
      await updateEmployee(id, formData);
      setSuccessMsg('Cập nhật nhân viên thành công!');
    } else {
      await createEmployee(formData);
      setSuccessMsg('Tạo mới nhân viên thành công!');
      setTimeout(() => navigate('/employees'), 1500);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportError('');
    let successCount = 0;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData.length) throw new Error('File Excel không chứa dữ liệu.');

      const employees = jsonData.map(row => ({
        name: row['Họ và tên'] || row['Name'] || '',
        phone: row['Số điện thoại'] || row['Phone'] || '',
        date_of_birth: formatDate(row['Ngày sinh'] || row['Date of Birth']),
        gender: row['Giới tính'] || row['Gender'] || '',
        email: row['Email'] || '',
        hire_date: formatDate(row['Ngày vào làm'] || row['Hire Date']),
        department_id: row['Phòng ban'] || row['Department'] || null,
        position_id: row['Chức vụ'] || row['Position'] || null,
        status: row['Trạng thái'] || row['Status'] || 'Đang làm việc',
        sync_to_payroll: true,
      }));

      for (const emp of employees) {
        try {
          await createEmployee(emp);
          successCount++;
        } catch (err) {
          console.error(`Lỗi khi import nhân viên "${emp.name}":`, err);
        }
      }

      setSuccessMsg(`Đã nhập thành công ${successCount}/${employees.length} nhân viên.`);
    } catch (err) {
      console.error('Import Excel failed:', err);
      setImportError(err.message || 'Không thể đọc file Excel.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <MainLayout title={id ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}>
      {successMsg && (
        <div className="success-banner">
          ✓ {successMsg}
          <button onClick={() => setSuccessMsg('')}><X size={16} /></button>
        </div>
      )}

      {importError && (
        <div className="error-banner" role="alert">
          <AlertCircle size={18} /> <span>{importError}</span>
          <button className="btn ghost" onClick={() => setImportError('')}>×</button>
        </div>
      )}

      <div className="section-head page-title">
        <div>
          <h2>{id ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}</h2>
          <p>Vui lòng nhập đầy đủ thông tin để đảm bảo quyền lợi và bảo hiểm của nhân viên.</p>
        </div>
        <button className="btn ghost" onClick={handleFileButtonClick} disabled={importing}>
          {importing ? 'Đang nhập...' : <><FileUp size={17} /> Nhập từ Excel</>}
        </button>
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
      </div>

      {importing && (
        <div className="loading-overlay">
          <div className="spinner" />
          <p>Đang nhập dữ liệu từ Excel...</p>
        </div>
      )}

      <EmployeeForm employeeData={employee || {}} onSubmit={handleSubmit} isEdit={!!id} />

      {!id && <EmployeeExtraCards />}
    </MainLayout>
  );
}