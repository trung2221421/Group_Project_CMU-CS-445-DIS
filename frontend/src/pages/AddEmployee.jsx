// src/pages/Employee.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FileUp, X, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import MainLayout from '../layout/MainLayout.jsx';
import EmployeeForm from '../components/forms/EmployeeForm.jsx';
import { createEmployee, updateEmployee, getEmployeeById } from '../services/addEmployeeService.js';
import { getFilters } from '../services/employeesService.js';
// Đã xóa import CURRENT_USER

const formatDate = (value) => {
  if (!value) return '';
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }
  const date = new Date(value);
  if (!isNaN(date.getTime())) return date.toISOString().split('T')[0];
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

  useEffect(() => {
    if (id) {
      getEmployeeById(id).then(setEmployee).catch(err => { console.error(err); setEmployee(null); });
    } else setEmployee(null);
  }, [id]);

  const handleSubmit = async (formData) => {
    if (id) {
      await updateEmployee(id, formData);
      setSuccessMsg('Cập nhật nhân viên thành công!');
    } else {
      const result = await createEmployee(formData);
      if (formData.create_account && result.id) {
        try {
          const res = await fetch('http://localhost:8000/api/accounts/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // Đã bỏ X-User
            },
            body: JSON.stringify({
              username: formData.account_username,
              password: formData.account_password,
              employee_id: result.id,
              full_name: formData.name,
              email: formData.email,
            }),
          });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || 'Lỗi tạo tài khoản');
          }
        } catch (err) {
          console.error('Lỗi tạo tài khoản:', err);
          setSuccessMsg(`Nhân viên đã được tạo nhưng tài khoản bị lỗi: ${err.message}`);
          setTimeout(() => navigate('/employees'), 2000);
          return;
        }
      }
      setSuccessMsg('Tạo mới nhân viên thành công!');
      setTimeout(() => navigate('/employees'), 1500);
    }
  };

  const handleFileButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    setImportError('');
    setSuccessMsg('');

    try {
      const filters = await getFilters();
      const deptMap = {};
      (filters.departments || []).forEach(d => {
        if (typeof d === 'object' && d.name) deptMap[d.name.toLowerCase().trim()] = d.id;
      });
      const roleMap = {};
      (filters.roles || []).forEach(r => {
        if (typeof r === 'object' && r.name) roleMap[r.name.toLowerCase().trim()] = r.id;
      });

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (!jsonData.length) throw new Error('File Excel không chứa dữ liệu.');

      const errors = [];
      const successList = [];
      const toImport = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const name = (row['Họ và tên'] || row['Name'] || '').trim();
        const phone = (row['Số điện thoại'] || row['Phone'] || '').trim();
        if (!name || !phone) {
          errors.push({ 'Mã NV': row['Mã NV'] || '', 'Họ và tên': name, 'Lỗi': 'Thiếu họ tên hoặc số điện thoại.' });
          continue;
        }

        let department_id = row['Phòng ban'] || row['Department'];
        if (department_id && isNaN(Number(department_id))) {
          const idFromName = deptMap[department_id.toLowerCase().trim()];
          if (idFromName !== undefined) department_id = idFromName;
          else { errors.push({ 'Mã NV': row['Mã NV'] || '', 'Họ và tên': name, 'Lỗi': `Phòng ban "${department_id}" không tồn tại.` }); continue; }
        } else if (department_id) department_id = Number(department_id);
        else department_id = null;

        let position_id = row['Chức vụ'] || row['Position'];
        if (position_id && isNaN(Number(position_id))) {
          const idFromName = roleMap[position_id.toLowerCase().trim()];
          if (idFromName !== undefined) position_id = idFromName;
          else { errors.push({ 'Mã NV': row['Mã NV'] || '', 'Họ và tên': name, 'Lỗi': `Chức vụ "${position_id}" không tồn tại.` }); continue; }
        } else if (position_id) position_id = Number(position_id);
        else position_id = null;

        const username = (row['UserName'] || '').trim();
        const password = (row['PasswordHash'] || '').trim();

        if (username) {
          try {
            const res = await fetch(`http://localhost:8000/api/accounts/check-username?username=${encodeURIComponent(username)}`);
            // Đã bỏ header X-User
            if (res.ok) {
              const check = await res.json();
              if (check.exists) {
                errors.push({ 'Mã NV': row['Mã NV'] || '', 'Họ và tên': name, 'Lỗi': `Tên đăng nhập "${username}" đã tồn tại.` });
                continue;
              }
            } else {
              const errorText = await res.text();
              errors.push({ 'Mã NV': row['Mã NV'] || '', 'Họ và tên': name, 'Lỗi': `Lỗi kiểm tra username: ${errorText}` });
              continue;
            }
          } catch (err) {
            errors.push({ 'Mã NV': row['Mã NV'] || '', 'Họ và tên': name, 'Lỗi': `Lỗi kiểm tra username: ${err.message}` });
            continue;
          }
        }

        toImport.push({
          name,
          phone,
          date_of_birth: formatDate(row['Ngày sinh'] || row['Date of Birth']) || null,
          gender: (row['Giới tính'] || row['Gender'] || '').trim() || null,
          email: (row['Email'] || '').trim() || null,
          hire_date: formatDate(row['Ngày vào làm'] || row['Hire Date']) || null,
          department_id,
          position_id,
          status: (row['Trạng thái'] || row['Status'] || 'Đang làm việc').trim(),
          sync_to_payroll: true,
          create_account: username && password ? true : false,
          account_username: username || '',
          account_password: password || '',
        });
      }

      for (const emp of toImport) {
        try {
          const result = await createEmployee(emp);
          if (emp.create_account && result.id) {
            try {
              const res = await fetch('http://localhost:8000/api/accounts/create', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  username: emp.account_username,
                  password: emp.account_password,
                  employee_id: result.id,
                  full_name: emp.name,
                  email: emp.email,
                }),
              });
              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Lỗi tạo tài khoản');
              }
            } catch (err) {
              errors.push({ 'Mã NV': '', 'Họ và tên': emp.name, 'Lỗi': `Tài khoản: ${err.message}` });
            }
          }
          successList.push({ 'Mã NV': '', 'Họ và tên': emp.name });
        } catch (err) {
          errors.push({ 'Mã NV': '', 'Họ và tên': emp.name, 'Lỗi': err.message || 'Lỗi không xác định' });
        }
      }

      if (errors.length > 0) {
        const resultData = [...errors, ...successList.map(s => ({ ...s, 'Lỗi': '' }))];
        const ws = XLSX.utils.json_to_sheet(resultData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ket_qua_import');
        XLSX.writeFile(wb, 'Ket_qua_nhap_nhan_vien.xlsx');
      }

      const totalSuccess = successList.length;
      const totalError = errors.length;
      setSuccessMsg(
        totalError > 0
          ? `Đã nhập thành công ${totalSuccess} nhân viên. ${totalError} lỗi (xem file kết quả).`
          : `Đã nhập thành công toàn bộ ${totalSuccess} nhân viên.`
      );
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
    </MainLayout>
  );
}