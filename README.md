### 📂 Cấu trúc thư mục dự án
```text
BackendForm/
├── README.md
├── venv/
└── src/
    ├── main.py (đã làm)
    ├── .env (đã làm)
    ├── config/
    │   ├── env.py (đã làm)
    │   ├── mysql.py (đã làm)
    │   └── sqlserver.py (đã làm)
    ├── middlewares/
    ├── modules/
    │   ├── Func/
    │   ├── attendance/
    │   ├── auth/
    │   ├── dashboard/
    │   │   ├── dashboard_model_mysql.py (đã làm)
    │   │   ├── dashboard_model_sql.py (đã làm)
    │   │   ├── dashboard_route.py (đã làm)
    │   │   ├── dashboard_schema.py (đã làm)
    │   │   └── dashboard_service.py (đã làm)
    │   ├── payroll/
    │   └── reports/
    │       ├── reports_route.py (đã làm)
    │       ├── reports_schema.py (đã làm)
    │       └── reports_service.py (đã làm)
    └── utils/

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
        ├── Reports.jsx (đã làm)
        ├── Settings.jsx
        └── Users.jsx
