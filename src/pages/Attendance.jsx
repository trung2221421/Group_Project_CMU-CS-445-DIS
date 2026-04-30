import { Download, Plus } from 'lucide-react';
import MainLayout from '../layout/MainLayout.jsx';
import Card from '../components/ui/Card.jsx';
import DonutChart from '../components/charts/DonutChart.jsx';
import Table, { statusBadge } from '../components/ui/Table.jsx';

const rows = [
  { id:'01', code:'NV0432', name:'Nguyễn Văn An', dept:'Kỹ thuật Phần mềm', work:'22.0', leave:'0.0', absent:'0.0', total:'0.0', status:'Bình thường'},
  { id:'02', code:'NV0511', name:'Trần Thị Bình', dept:'Nhân sự', work:'18.5', leave:'3.5', absent:'0.0', total:'3.5', status:'Nghỉ nhiều'},
  { id:'03', code:'NV0298', name:'Lê Văn Cường', dept:'Kinh doanh', work:'14.0', leave:'1.0', absent:'7.0', total:'8.0', status:'Vắng quá hạn'},
  { id:'04', code:'NV0844', name:'Phạm Diệu Hoa', dept:'Marketing', work:'21.5', leave:'0.5', absent:'0.0', total:'0.5', status:'Bình thường'},
];
export default function Attendance(){return <MainLayout title="Quản lý Chấm công" subtitle="Theo dõi tình trạng đi làm, nghỉ phép và vắng mặt của nhân sự"><div className="actions-row right"><select><option>Tháng 11/2024</option></select><select><option>Tất cả phòng ban</option></select><button className="btn primary"><Download/> Xuất báo cáo</button></div><div className="grid attendance-grid"><Card><div className="section-head"><h2>Thống kê chuyên cần</h2><span className="chip blue-bg">+2.4% so với tháng trước</span></div><div className="attendance-metrics"><b>2,450<span>Tổng ngày công</span></b><b>124<span>Tổng nghỉ phép</span></b><b className="red-text">12<span>Tổng vắng</span></b></div></Card><Card className="center"><DonutChart value={92}/><p>Đạt mục tiêu vận hành</p></Card><Card className="approval-card"><h4>PHÊ DUYỆT NHANH</h4><h2>8 Đơn nghỉ phép</h2><p>Đang chờ xử lý trong ngày hôm nay.</p><button className="btn white full">Kiểm tra ngay</button></Card></div><Card><div className="section-head"><h2>Danh sách chấm công chi tiết</h2><button className="floating-btn"><Plus/></button></div><Table columns={[{key:'id',label:'ID'},{key:'code',label:'Mã NV'},{key:'name',label:'Họ tên'},{key:'dept',label:'Phòng ban'},{key:'work',label:'Ngày công'},{key:'leave',label:'Phép'},{key:'absent',label:'Vắng'},{key:'total',label:'Tổng nghỉ'},{key:'status',label:'Trạng thái'}]} rows={rows} renderCell={(r,c)=>c.key==='status'?statusBadge(r.status):r[c.key]} /></Card></MainLayout>}
