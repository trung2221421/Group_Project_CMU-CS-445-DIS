# Payroll Pro - HRM Enterprise Frontend

Giao diện React/Vite mô phỏng hệ thống HR & Payroll Integration Dashboard theo các màn hình thiết kế: Login, Dashboard, Employees, Employee Form, Departments, Payroll, Attendance, Reports, Alerts, User Management, Audit Logs và Integration Sync.

## Chạy project

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

## Cấu trúc chính

```txt
src/
  components/
    charts/
    forms/
      EmployeeForm.jsx
    layout/
    ui/
      Table.jsx
  layout/
  pages/
      Employee.jsx
      Employees.jsx
  services/
      EmployeeService.js
      EmployeesService.js

  App.jsx
  data.js
  index.css
  main.jsx     đã sửa
  router.jsx
```

## Ghi chú

- Dữ liệu hiện đang là mock data trong `src/data.js`.
- Có thể kết nối API thật bằng cách thay mock data bằng service/fetch/axios.
- CSS tập trung trong `src/index.css` để dễ chỉnh theme, spacing, màu sắc và responsive.
