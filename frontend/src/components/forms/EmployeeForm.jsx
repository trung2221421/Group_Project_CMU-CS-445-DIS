import { AlertTriangle, Camera, CheckCircle2, FileText, Save } from 'lucide-react';
import Card from '../ui/Card.jsx';

export default function EmployeeForm() {
  const fields = ['Họ và tên *', 'Số điện thoại *', 'Ngày sinh', 'Giới tính', 'Email công ty', 'Ngày vào làm', 'Phòng ban', 'Chức vụ'];
  return (
    <Card className="employee-form-card">
      <div className="profile-upload"><div className="profile-photo">👨🏻‍💼<button><Camera size={18} /></button></div><b>TẢI LÊN ẢNH CHÂN DUNG CHUYÊN NGHIỆP</b></div>
      <div className="form-main">
        <div className="warning-box"><AlertTriangle /> <div><b>CẢNH BÁO DỮ LIỆU</b><p>Email này có thể đã tồn tại trong hệ thống. Vui lòng kiểm tra lại để tránh trùng lặp bản ghi.</p></div></div>
        <div className="form-grid">{fields.map((field, index) => <label key={field}><span>{field}</span><input defaultValue={index === 0 ? 'Phạm Minh Anh' : index === 1 ? '0987 654 321' : index === 4 ? 'anh.pham@hrm-enterprise.com' : ''} placeholder={field} /></label>)}</div>
        <div className="sync-option"><CheckCircle2 /> <div><b>Đồng bộ nhân viên này sang Payroll</b><p>Hệ thống tự động tạo hồ sơ lương và chu kỳ tính lương dựa trên thông tin ngày vào làm và phòng ban.</p></div></div>
      </div>
      <div className="form-footer"><button className="btn ghost">Hủy bỏ</button><button className="btn primary"><Save size={17}/> Lưu thay đổi</button></div>
    </Card>
  );
}

export function EmployeeExtraCards() {
  return <div className="two-cols"><Card><h3>HỢP ĐỒNG HIỆN TẠI</h3><div className="inline-info"><FileText/> <div><b>HĐLĐ Không xác định thời hạn</b><p>Ký ngày: 15/01/2023 · Mã HĐ: HRM-2023-084</p></div></div></Card><Card><h3>THIẾT BỊ CẤP PHÁT</h3><p><span className="chip">MacBook Pro M2</span> <span className="chip">Dell Monitor 24''</span> <span className="chip">+2 thiết bị</span></p></Card></div>;
}
