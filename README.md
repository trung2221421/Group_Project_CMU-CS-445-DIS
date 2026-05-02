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

BackendForm/
├── README.md
├── venv/
└── src/
    ├── main.py (đã làm)
    ├── .env (đã làm)
    ├── test_db.py
    ├── __pycache__/
    ├── config/
    │   ├── __pycache__/
    │   ├── env.py (đã làm)
    │   ├── mysql.py (đã làm)
    │   └── sqlserver.py (đã làm)
    ├── middlewares/
    ├── modules/
    │   ├── Func/
    │   ├── attendance/
    │   ├── auth/
    │   ├── dashboard/
    │   │   ├── __pycache__/
    │   │   ├── dashboard_model_mysql.py (đã làm)
    │   │   ├── dashboard_model_sql.py (đã làm)
    │   │   ├── dashboard_route.py (đã làm)
    │   │   ├── dashboard_schema.py (đã làm)
    │   │   └── dashboard_service.py (đã làm)
    │   ├── payroll/
    │   └── reports/
    └── utils/
Thư mục Frontend (frontend)
frontend/
├── index.html
├── README.md
├── node_modules/
├── public/
└── src/
    ├── App.jsx
    ├── data.js
    ├── index.css
    ├── main.jsx
    ├── router.jsx
    ├── components/
    │   ├── charts/
    │   │   ├── BarChart.jsx (đã làm)
    │   │   ├── DepartmentChart.jsx (đã làm)
    │   │   └── DonutChart.jsx (đã làm)
    │   ├── common/
    │   ├── forms/
    │   ├── layout/
    │   └── ui/
    │       ├── Badge.jsx
    │       ├── Card.jsx
    │       ├── StatCard.jsx
    │       └── Table.jsx (đã làm)
    ├── layout/
    └── pages/
        ├── AddEmployee.jsx
        ├── Alerts.jsx
        ├── Attendance.jsx
        ├── AuditLogs.jsx
        ├── Dashboard.jsx (đã làm)
        ├── Departments.jsx
        ├── Employees.jsx
        ├── IntegrationSync.jsx
        ├── Login.jsx
        ├── Payroll.jsx
        ├── Reports.jsx
        ├── Settings.jsx
        └── Users.jsx

## Ghi chú

- Dữ liệu hiện đang là mock data trong `src/data.js`.
- Có thể kết nối API thật bằng cách thay mock data bằng service/fetch/axios.
- CSS tập trung trong `src/index.css` để dễ chỉnh theme, spacing, màu sắc và responsive.
