// src/components/forms/EmployeeForm.jsx
import { useState, useEffect } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Save } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { getFilters } from '../../services/employeesService';

const STATUS_OPTIONS = [
  'Đang làm việc', 'Nghỉ phép', 'Thử việc', 'Thực tập', 'Nghỉ việc', 'Tạm nghỉ',
];

export default function EmployeeForm({ employeeData, onSubmit, isEdit = false }) {
  const [form, setForm] = useState({
    name: '', phone: '', date_of_birth: '', gender: '', email: '',
    hire_date: '', department_id: '', position_id: '', status: 'Đang làm việc',
    sync_to_payroll: true,
  });

  const [createAccount, setCreateAccount] = useState(false);
  const [accountData, setAccountData] = useState({ username: '', password: '' });
  const [usernameError, setUsernameError] = useState('');

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (employeeData && Object.keys(employeeData).length > 0) {
      setForm(prev => ({ ...prev, ...employeeData, department_id: employeeData.department_id ?? '', position_id: employeeData.position_id ?? '' }));
      setCreateAccount(false);
      setAccountData({ username: '', password: '' });
    } else {
      setForm({ name: '', phone: '', date_of_birth: '', gender: '', email: '', hire_date: '', department_id: '', position_id: '', status: 'Đang làm việc', sync_to_payroll: true });
      setCreateAccount(false);
      setAccountData({ username: '', password: '' });
    }
  }, [employeeData]);

  useEffect(() => {
    getFilters().then(data => {
      setDepartments(data.departments || []);
      setPositions(data.roles || []);
    }).catch(console.error);
  }, []);

  const checkUsername = async (username) => {
    if (!username) { setUsernameError(''); return true; }
    try {
      const res = await fetch(`http://localhost:8000/api/accounts/check-username?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.exists) { setUsernameError('Tên đăng nhập đã tồn tại'); return false; }
        else { setUsernameError(''); return true; }
      }
    } catch (err) { console.error('Lỗi kiểm tra username:', err); }
    return true;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'account_username') {
      setAccountData(prev => ({ ...prev, username: value }));
      checkUsername(value);
      return;
    }
    if (name === 'account_password') {
      setAccountData(prev => ({ ...prev, password: value }));
      return;
    }
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError('Vui lòng nhập Họ tên và Số điện thoại'); return; }
    if (createAccount) {
      if (!accountData.username || !accountData.password) { setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'); return; }
      if (usernameError) { setError('Tên đăng nhập không hợp lệ'); return; }
    }

    const payload = {
      ...form,
      department_id: form.department_id ? parseInt(form.department_id) : null,
      position_id: form.position_id ? parseInt(form.position_id) : null,
      create_account: createAccount,
      account_username: accountData.username,
      account_password: accountData.password,
    };

    setLoading(true);
    setError('');
    try { await onSubmit(payload); }
    catch (err) { setError(err.message || 'Có lỗi xảy ra'); }
    finally { setLoading(false); }
  };

  const renderOptions = (items) => items.map((item, idx) => {
    if (typeof item === 'string') return <option key={idx} value={item}>{item}</option>;
    return <option key={item.id || idx} value={item.id}>{item.name}</option>;
  });

  return (
    <Card className="employee-form-card">
      <div className="profile-upload"><div className="profile-photo">👨🏻‍💼<button type="button"><Camera size={18} /></button></div><b>TẢI LÊN ẢNH CHÂN DUNG CHUYÊN NGHIỆP</b></div>
      <form onSubmit={handleSubmit} className="form-main">
        {error && <div className="warning-box"><AlertTriangle /> <div><b>LỖI</b><p>{error}</p></div></div>}
        <div className="form-grid">
          <label><span>Họ và tên *</span><input name="name" value={form.name} onChange={handleChange} placeholder="Họ và tên" required /></label>
          <label><span>Số điện thoại *</span><input name="phone" value={form.phone} onChange={handleChange} placeholder="Số điện thoại" required /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <label><span>Ngày sinh</span><input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} /></label>
            <label><span>Giới tính</span><select name="gender" value={form.gender} onChange={handleChange} style={{ width: '100%' }}><option value="">Chọn</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option><option value="Khác">Khác</option></select></label>
          </div>
          <label><span>Email công ty</span><input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" /></label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
            <label><span>Phòng ban</span><select name="department_id" value={form.department_id} onChange={handleChange} style={{ width: '100%' }}><option value="">Chọn phòng ban</option>{renderOptions(departments)}</select></label>
            <label><span>Chức vụ</span><select name="position_id" value={form.position_id} onChange={handleChange} style={{ width: '100%' }}><option value="">Chọn chức vụ</option>{renderOptions(positions)}</select></label>
          </div>
          <label><span>Ngày vào làm</span><input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} /></label>
          <label style={{ gridColumn: '1 / -1' }}><span>Trạng thái</span><select name="status" value={form.status} onChange={handleChange} style={{ width: '100%' }}>{STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button type="button" className={`btn ${createAccount ? 'danger' : 'primary'}`} onClick={() => setCreateAccount(!createAccount)} style={{ minWidth: '180px' }}>
            {createAccount ? 'Hủy tạo tài khoản' : 'Tạo tài khoản'}
          </button>
        </div>

        {createAccount && (
          <div className="account-section" style={{ marginTop: '20px', border: '1px solid #d0d5dd', borderRadius: '12px', padding: '16px', background: '#f9fafb' }}>
            <h3>Thông tin tài khoản</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                <span>Tên đăng nhập</span>
                <input name="account_username" value={accountData.username} onChange={handleChange} placeholder="Username" required={createAccount} style={{ borderColor: usernameError ? 'red' : undefined }} />
                {usernameError && <small style={{ color: 'red' }}>{usernameError}</small>}
              </label>
              <label>
                <span>Mật khẩu</span>
                <input type="password" name="account_password" value={accountData.password} onChange={handleChange} placeholder="Mật khẩu" required={createAccount} />
              </label>
            </div>
          </div>
        )}

        <div className="sync-option"><CheckCircle2 /><div><b>Đồng bộ nhân viên này sang Payroll</b><p>Hệ thống tự động tạo hồ sơ lương dựa trên thông tin.</p></div><input type="checkbox" name="sync_to_payroll" checked={form.sync_to_payroll} onChange={handleChange} /></div>
        <div className="form-footer">
          <button type="button" className="btn ghost" onClick={() => window.history.back()}>Hủy bỏ</button>
          <button type="submit" className="btn primary" disabled={loading}><Save size={17} /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
        </div>
      </form>
    </Card>
  );
}