import { NavLink, useNavigate } from 'react-router-dom';
import { AlertTriangle, BarChart3, Bell, CalendarCheck, DatabaseZap, LayoutDashboard, LogOut, Network, Settings, Shield, Users, WalletCards } from 'lucide-react';
import {
  clearStoredAuth,
  getRoleName,
  getStoredAuth,
  hasPermission,
  isAdmin,
} from '../../utils/permissions.js';

const items = [
  { to: '/dashboard', label: 'Dashboard', functionName: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', functionName: 'Employees', icon: Users },
  { to: '/departments', label: 'Departments & Positions', functionName: 'Departments & Positions', icon: Network },
  { to: '/payroll', label: 'Payroll', functionName: 'Payroll', icon: WalletCards },
  { to: '/attendance', label: 'Attendance', functionName: 'Attendance', icon: CalendarCheck },
  { to: '/reports', label: 'Reports & Analytics', functionName: 'Reports & Analytics', icon: BarChart3 },
  { to: '/Alerts', label: 'Notifications', functionName: 'Notifications', icon: Bell },
  { to: '/audit-logs', label: 'Audit Logs', functionName: 'Audit Logs', icon: AlertTriangle },
  { to: '/sync', label: 'Integration Sync', functionName: 'Integration Sync', icon: DatabaseZap },
  { to: '/settings', label: 'Settings', functionName: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, roles } = getStoredAuth();
  const visibleItems = isAdmin()
    ? items
    : items.filter((item) => hasPermission(item.functionName, 'View'));
  const initials = (user?.fullName || user?.username || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    clearStoredAuth();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">▦</div>
        <div><strong>SYSTEM</strong></div>
      </div>
      <nav className="sidebar-nav">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user">
        <div className="avatar dark">{initials}</div>
        <div>
          <strong>{user?.fullName || user?.username || 'User'}</strong>
          <span>
            {roles
              ?.map((role) => role.RoleName || role.roleName || role.name || role.Name)
              .filter(Boolean)
              .join(', ') || 'Authenticated'}
          </span>
        </div>
        <button type="button" className="icon-button" onClick={handleLogout} title="Đăng xuất">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
