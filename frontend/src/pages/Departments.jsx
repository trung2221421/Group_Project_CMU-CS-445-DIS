import { Plus, RefreshCcw } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';
import { departments } from '../data.js';

export default function Departments() {
  return <MainLayout title="Quản lý Cấu trúc Tổ chức"><div className="tabs"><button className="active">Phòng ban</button><button>Chức vụ</button></div><div className="actions-row"><button className="btn primary"><Plus/> Thêm phòng ban</button><button className="btn ghost"><RefreshCcw/> Đồng bộ tất cả sang Payroll</button><div className="warn-inline">Không thể xóa phòng ban nếu vẫn còn nhân viên hoặc bản ghi lương liên quan.</div></div><Card><Table columns={[{key:'code',label:'Mã phòng ban'},{key:'name',label:'Tên phòng ban'},{key:'status',label:'Trạng thái đồng bộ'},{key:'count',label:'Số lượng nhân viên'}]} rows={departments} renderCell={(r,c)=>c.key==='status'?statusBadge(r.status):r[c.key]} /></Card><div className="grid three color-cards"><Card><h3>Tối ưu hóa tổ chức</h3><p>Sắp xếp nhân sự theo mô hình Agile</p></Card><Card><h3>242 Tổng nhân viên</h3><p>Cập nhật lúc 08:30 sáng nay</p></Card><Card><h3>Phân quyền chặt chẽ</h3><p>Truy cập theo cấp bậc phòng ban</p></Card></div></MainLayout>;
}
