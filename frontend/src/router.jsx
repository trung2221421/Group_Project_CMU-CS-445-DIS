import { createBrowserRouter, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import EmployeeFormPage from './pages/AddEmployee.jsx';
import Departments from './pages/Departments.jsx';
import Payroll from './pages/Payroll.jsx';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports.jsx';
import Alerts from './pages/Alerts.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import IntegrationSync from './pages/IntegrationSync.jsx';
import Login from './pages/Login.jsx';
import Settings from './pages/Settings.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';

const protectedElement = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/Login" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/dashboard', element: protectedElement(<Dashboard />) },
  { path: '/employees', element: protectedElement(<Employees />) },
  { path: '/employees/new', element: protectedElement(<EmployeeFormPage />) },
  { path: '/departments', element: protectedElement(<Departments />) },
  { path: '/payroll', element: protectedElement(<Payroll />) },
  { path: '/attendance', element: protectedElement(<Attendance />) },
  { path: '/reports', element: protectedElement(<Reports />) },
  { path: '/Alerts', element: protectedElement(<Alerts />) },
  { path: '/audit-logs', element: protectedElement(<AuditLogs />) },
  { path: '/sync', element: protectedElement(<IntegrationSync />) },
  { path: '/settings', element: protectedElement(<Settings />) },
  { path: '*', element: <Navigate to="/Login" replace /> },
]);
