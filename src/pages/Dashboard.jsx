import { AlertTriangle, Building2, CalendarCheck, CheckCircle2, Users, WalletCards } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';
import BarChart from '../components/charts/BarChart.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import { payrollRows } from '../data.js';

export default function Dashboard() {
  return (
    <MainLayout title="Tổng quan Dashboard">
      <div className="stats-grid six">
        <StatCard icon={Users} label="Tổng nhân viên" value="1,250" note="+2.4%" />
        <StatCard icon={CheckCircle2} label="Nhân viên chính thức" value="1,180" note="94%" tone="cyan" />
        <StatCard icon={Building2} label="Tổng số phòng ban" value="12" tone="orange" />
        <StatCard icon={WalletCards} label="Chi phí lương tháng" value="4.5B VND" tone="green" />
        <StatCard icon={CalendarCheck} label="Số ngày nghỉ phép" value="45 Ngày" tone="purple" />
        <StatCard icon={AlertTriangle} label="Cảnh báo tồn đọng" value="8" tone="red" danger />
      </div>
      <div className="grid dashboard-main">
        <Card><div className="section-head"><div><h2>Xu hướng lương hàng tháng</h2><p>Dữ liệu tổng hợp 6 tháng gần nhất</p></div><button className="pill">2023 - 2024</button></div><BarChart /></Card>
        <Card className="alert-card"><h2>🚨 Cảnh báo & Thông báo</h2>{['Kỷ niệm ngày làm việc', 'Cảnh báo nghỉ phép quá quy định', 'Chênh lệch lương'].map((x) => <div className="mini-alert" key={x}><b>{x}</b><p>Thông báo cần xử lý trong tuần này.</p></div>)}</Card>
      </div>
      <div className="grid three">
        <Card><h2>Nhân viên theo phòng ban</h2>{[['Kỹ thuật',88,450],['Kinh doanh',63,320],['Marketing',35,180],['Kế toán',24,120],['Nhân sự',16,80]].map(([n,w,c]) => <div className="progress-row" key={n}><span>{n}<b>{c} nv</b></span><div><i style={{width:`${w}%`}} /></div></div>)}</Card>
        <Card className="center"><h2>Tóm tắt điểm danh</h2><DonutChart value={98} /><div className="legend"><span>Ngày công 1,125</span><span>Nghỉ phép 84</span><span>Vắng mặt 41</span></div></Card>
        <Card><h2>Hoạt động gần đây</h2>{['Đã đồng bộ nhân viên Nguyễn Văn A', 'Cập nhật thông tin Phòng Kế toán', 'Phát hiện bất thường về lương', 'Thêm mới 3 nhân viên'].map((x,i)=><div className="activity" key={x}><span>{i+1}</span><p>{x}<small>{i === 0 ? '10 phút trước' : 'Hôm qua'}</small></p></div>)}</Card>
      </div>
      <Card><div className="section-head"><h2>Danh sách lương chờ duyệt</h2><div><button className="btn primary small">Duyệt tất cả</button><button className="btn ghost small">Xuất Excel</button></div></div><Table columns={[{key:'name',label:'Nhân viên'},{key:'dept',label:'Phòng ban'},{key:'base',label:'Lương cơ bản'},{key:'allowance',label:'Phụ cấp'},{key:'status',label:'Trạng thái'}]} rows={payrollRows} renderCell={(r,c)=>c.key==='status'?statusBadge(r.status):r[c.key]} /></Card>
    </MainLayout>
  );
}
