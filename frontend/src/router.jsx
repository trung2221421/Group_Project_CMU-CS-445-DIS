import { createBrowserRouter, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeFormPage from './pages/AddEmployee.jsx';
import Departments from './pages/Departments.jsx';
import Payroll from './pages/Payroll.jsx';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports.jsx';
import Alerts from './pages/Alerts.jsx';
import Users from './pages/Users.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import IntegrationSync from './pages/IntegrationSync.jsx';
import Login from './pages/Login.jsx';
import Settings from './pages/Settings.jsx';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/employees', element: <Employees /> },
  { path: '/employees/new', element: <EmployeeFormPage /> },
  { path: '/departments', element: <Departments /> },
  { path: '/payroll', element: <Payroll /> },
  { path: '/attendance', element: <Attendance /> },
  { path: '/reports', element: <Reports /> },
  { path: '/alerts', element: <Alerts /> },
  { path: '/users', element: <Users /> },
  { path: '/audit-logs', element: <AuditLogs /> },
  { path: '/sync', element: <IntegrationSync /> },
  { path: '/settings', element: <Settings /> },
]);
