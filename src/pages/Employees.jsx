import { Link } from 'react-router-dom';
import { Filter, Plus, Search } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Table from '../components/ui/Table.jsx';
import { employees } from '../data.js';

export default function Employees() {
  return (
    <MainLayout title="Quản lý nhân viên">
      <Card className="toolbar-card"><label className="input-icon"><Search size={18}/><input placeholder="Tìm kiếm nhân viên..." /></label><select><option>Phòng ban</option></select><select><option>Chức vụ</option></select><button className="btn ghost"><Filter size={17}/> Lọc</button><Link className="btn primary" to="/employees/new"><Plus size={17}/> Thêm nhân viên</Link></Card>
      <div className="split employee-split">
        <Card><Table columns={[{key:'id',label:'ID'},{key:'name',label:'Họ và tên'},{key:'dept',label:'Phòng ban / Chức vụ'},{key:'email',label:'Thông tin liên hệ'}]} rows={employees} renderCell={(r,c)=> c.key==='name' ? <div className="person"><div className="avatar">{r.initials}</div><div><b>{r.name}</b><small>ID: {r.id}</small></div></div> : c.key==='dept' ? <div>{r.dept}<small>{r.role}</small></div> : c.key==='email' ? <div>{r.email}<small>{r.phone}</small></div> : r[c.key]} /></Card>
        <Card className="detail-panel"><button className="close">×</button><div className="profile-lg">👨🏻‍💼<span/></div><h2>Nguyễn Văn A</h2><p className="blue">Kỹ sư Phần mềm Senior</p><span className="chip">MÃ NV: NV001</span><h4>THÔNG TIN CÁ NHÂN</h4><div className="info-box"><p><span>Email</span><b>vana@company.com</b></p><p><span>Số điện thoại</span><b>0901 234 567</b></p><p><span>Địa chỉ</span><b>Quận 7, TP. Hồ Chí Minh</b></p></div><h4>TRẠNG THÁI PAYROLL</h4><div className="two-mini"><div><span>Lương cơ bản</span><b>25,000,000 đ</b></div><div><span>BHXH</span><b>Đã đóng</b></div></div><button className="btn primary full">Xuất báo cáo</button></Card>
      </div>
    </MainLayout>
  );
}
