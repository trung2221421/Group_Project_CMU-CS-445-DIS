import { Download, Filter } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import { payrollRows } from '../data.js';

export default function Payroll() {
  return <MainLayout title="Quản lý lương & Payroll"><div className="split payroll-split"><div className="stack"><Card className="toolbar-card payroll-filter"><label><span>CHỌN THÁNG</span><input defaultValue="March 2024" /></label><label><span>PHÒNG BAN</span><select><option>Tất cả phòng ban</option></select></label><label className="wide"><span>TÌM KIẾM NHÂN VIÊN</span><input placeholder="Nhập tên hoặc mã nhân viên..." /></label><button className="btn primary"><Filter/> Lọc dữ liệu</button><button className="btn blue"><Download/> Xuất báo cáo</button></Card><div className="stats-grid four"><StatCard label="Tổng quỹ lương" value="3,450,000,000 đ" note="+2.4%"/><StatCard label="Nhân viên đã thanh toán" value="142/145" tone="green"/><StatCard label="Tổng khấu trừ" value="542,000,000 đ" tone="red"/><StatCard label="Trạng thái chung" value="Đã chốt lương" tone="green"/></div><Card><Table columns={[{key:'id',label:'ID lương'},{key:'name',label:'Nhân viên'},{key:'dept',label:'Phòng ban'},{key:'base',label:'Lương cơ bản'},{key:'allowance',label:'Phụ cấp'},{key:'status',label:'Trạng thái'}]} rows={payrollRows} renderCell={(r,c)=>c.key==='status'?statusBadge(r.status):r[c.key]} /></Card></div><Card className="side-history"><h2>Lịch sử lương</h2><div className="person-card">👨🏻‍💼<div><h3>Nguyễn Văn An</h3><p>Kỹ sư Phần mềm Senior</p></div></div><h4>Xu hướng lương (6 tháng)</h4><BarChart values={[40,40,45,52,60,68]} /><div className="history-item"><b>Tháng 02/2024</b><span>31,500,000 đ</span></div><div className="history-item"><b>Tháng 01/2024</b><span>30,800,000 đ</span></div><button className="btn primary full">Xem Payslip chi tiết</button></Card></div></MainLayout>;
}
