export const employees = [
  { id: 'NV001', name: 'Nguyễn Văn A', role: 'Kỹ sư Phần mềm Senior', dept: 'Phòng Kỹ thuật', email: 'vana@company.com', phone: '0901 234 567', salary: '35,000,000 đ', status: 'Đang làm việc', initials: 'NA' },
  { id: 'NV002', name: 'Trần Thị Bích', role: 'HR Manager', dept: 'Phòng Nhân sự', email: 'bich.tt@enterprise.com', phone: '0902 345 678', salary: '22,000,000 đ', status: 'Đang làm việc', initials: 'TB' },
  { id: 'NV003', name: 'Lê Minh', role: 'Kế toán trưởng', dept: 'Phòng Tài chính', email: 'minh.le@enterprise.com', phone: '0903 456 789', salary: '42,000,000 đ', status: 'Đang làm việc', initials: 'LM' },
  { id: 'NV004', name: 'Phạm Diệu Hoa', role: 'Chuyên viên Marketing', dept: 'Marketing', email: 'hoa.pd@enterprise.com', phone: '0904 567 890', salary: '20,500,000 đ', status: 'Tạm nghỉ', initials: 'PH' },
];

export const departments = [
  { code: 'PB-001', name: 'Phòng Kỹ thuật & Công nghệ', status: 'Synced', count: 124 },
  { code: 'PB-002', name: 'Phòng Nhân sự & Đào tạo', status: 'Warning', count: 18 },
  { code: 'PB-003', name: 'Phòng Tài chính Kế toán', status: 'Synced', count: 12 },
  { code: 'PB-004', name: 'Phòng Kinh doanh Miền Bắc', status: 'Synced', count: 85 },
];

export const payrollRows = [
  { id: '#PR-2024-001', name: 'Nguyễn Văn An', dept: 'Phòng Kỹ thuật', base: '35,000,000 đ', allowance: '4,500,000 đ', status: 'Đã chốt lương' },
  { id: '#PR-2024-002', name: 'Trần Thị Bích', dept: 'Phòng Nhân sự', base: '22,000,000 đ', allowance: '2,000,000 đ', status: 'Chờ duyệt' },
  { id: '#PR-2024-003', name: 'Lê Minh', dept: 'Phòng Tài chính', base: '42,000,000 đ', allowance: '6,000,000 đ', status: 'Đã thanh toán' },
];

export const auditRows = [
  { id: '#LG-98241', user: 'Nguyễn Anh', role: 'Super Admin', action: 'Đã thêm nhân viên mới', module: 'EMPLOYEES', detail: "Thêm hồ sơ nhân viên 'Phạm Minh Đức'", time: '24/05/2024 09:45' },
  { id: '#LG-98240', user: 'Trần Bình', role: 'HR Manager', action: 'Cập nhật phòng ban', module: 'DEPARTMENTS', detail: "Thay đổi trưởng phòng Kỹ thuật", time: '24/05/2024 09:12' },
  { id: '#LG-98239', user: 'Hệ thống', role: 'System Bot', action: 'Đồng bộ Payroll thất bại', module: 'PAYROLL', detail: 'Lỗi kết nối tới Gateway ngân hàng', time: '24/05/2024 08:52' },
  { id: '#LG-98238', user: 'Lê Chi', role: 'Accountant', action: 'Duyệt bảng lương tháng 05', module: 'PAYROLL', detail: 'Xác nhận bảng lương cho 152 nhân viên', time: '24/05/2024 08:21' },
];
