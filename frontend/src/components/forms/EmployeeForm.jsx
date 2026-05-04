// src/components/forms/EmployeeForm.jsx
import { useState, useEffect } from 'react';
import { AlertTriangle, Camera, CheckCircle2, FileText, Save } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { getFilters } from '../../services/employeesService';

const STATUS_OPTIONS = [
  'Đang làm việc',
  'Nghỉ phép',
  'Thử việc',
  'Thực tập',
  'Nghỉ việc',
  'Tạm nghỉ',
];

export default function EmployeeForm({ employeeData, onSubmit, isEdit = false }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    email: '',
    hire_date: '',
    department_id: '',
    position_id: '',
    status: 'Đang làm việc',
    sync_to_payroll: true,
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ Đồng bộ dữ liệu khi employeeData thay đổi (chỉnh sửa / thêm mới)
  useEffect(() => {
    if (employeeData && Object.keys(employeeData).length > 0) {
      setForm(prev => ({
        ...prev,
        ...employeeData,
        // Đảm bảo các trường số không bị null
        department_id: employeeData.department_id ?? '',
        position_id: employeeData.position_id ?? '',
      }));
    } else {
      // Reset form khi thêm mới
      setForm({
        name: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        email: '',
        hire_date: '',
        department_id: '',
        position_id: '',
        status: 'Đang làm việc',
        sync_to_payroll: true,
      });
    }
  }, [employeeData]);

  useEffect(() => {
    getFilters()
      .then((data) => {
        const depts = data.departments || [];
        const roles = data.roles || [];
        setDepartments(depts);
        setPositions(roles);
      })
      .catch(console.error);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      setError('Vui lòng nhập Họ tên và Số điện thoại');
      return;
    }

    const payload = {
      ...form,
      department_id: form.department_id ? parseInt(form.department_id) : null,
      position_id: form.position_id ? parseInt(form.position_id) : null,
    };

    setLoading(true);
    setError('');
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const renderOptions = (items) => {
    return items.map((item, idx) => {
      if (typeof item === 'string') {
        return (
          <option key={idx} value={item}>
            {item}
          </option>
        );
      }
      return (
        <option key={item.id || idx} value={item.id}>
          {item.name}
        </option>
      );
    });
  };

  return (
    <Card className="employee-form-card">
      <div className="profile-upload">
        <div className="profile-photo">
          👨🏻‍💼<button type="button"><Camera size={18} /></button>
        </div>
        <b>TẢI LÊN ẢNH CHÂN DUNG CHUYÊN NGHIỆP</b>
      </div>

      <form onSubmit={handleSubmit} className="form-main">
        {error && (
          <div className="warning-box">
            <AlertTriangle /> <div><b>LỖI</b><p>{error}</p></div>
          </div>
        )}

        <div className="form-grid">
          <label>
            <span>Họ và tên *</span>
            <input name="name" value={form.name} onChange={handleChange} placeholder="Họ và tên" required />
          </label>
          <label>
            <span>Số điện thoại *</span>
            <input name="phone" value={form.phone} onChange={handleChange} placeholder="Số điện thoại" required />
          </label>
          <label>
            <span>Ngày sinh</span>
            <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} />
          </label>
          <label>
            <span>Giới tính</span>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">Chọn giới tính</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </label>
          <label>
            <span>Email công ty</span>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" />
          </label>
          <label>
            <span>Ngày vào làm</span>
            <input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} />
          </label>
          <label>
            <span>Phòng ban</span>
            <select name="department_id" value={form.department_id} onChange={handleChange}>
              <option value="">Chọn phòng ban</option>
              {renderOptions(departments)}
            </select>
          </label>
          <label>
            <span>Chức vụ</span>
            <select name="position_id" value={form.position_id} onChange={handleChange}>
              <option value="">Chọn chức vụ</option>
              {renderOptions(positions)}
            </select>
          </label>
          <label>
            <span>Trạng thái</span>
            <select name="status" value={form.status} onChange={handleChange}>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="sync-option">
          <CheckCircle2 />
          <div>
            <b>Đồng bộ nhân viên này sang Payroll</b>
            <p>Hệ thống tự động tạo hồ sơ lương dựa trên thông tin.</p>
          </div>
          <input type="checkbox" name="sync_to_payroll" checked={form.sync_to_payroll} onChange={handleChange} />
        </div>

        <div className="form-footer">
          <button type="button" className="btn ghost" onClick={() => window.history.back()}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn primary" disabled={loading}>
            <Save size={17} /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </Card>
  );
}

export function EmployeeExtraCards() {
  return (
    <div className="two-cols">
      <Card>
        <h3>HỢP ĐỒNG HIỆN TẠI</h3>
        <div className="inline-info">
          <FileText />
          <div>
            <b>HĐLĐ Không xác định thời hạn</b>
            <p>Ký ngày: 15/01/2023 · Mã HĐ: HRM-2023-084</p>
          </div>
        </div>
      </Card>
      <Card>
        <h3>THIẾT BỊ CẤP PHÁT</h3>
        <p>
          <span className="chip">MacBook Pro M2</span>
          <span className="chip">Dell Monitor 24''</span>
          <span className="chip">+2 thiết bị</span>
        </p>
      </Card>
    </div>
  );
}