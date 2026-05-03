import { NavLink } from 'react-router-dom';
import { AlertTriangle, BarChart3, Bell, CalendarCheck, DatabaseZap, LayoutDashboard, Network, Settings, Shield, Users, WalletCards } from 'lucide-react';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/departments', label: 'Departments & Positions', icon: Network },
  { to: '/payroll', label: 'Payroll', icon: WalletCards },
  { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/users', label: 'User Management', icon: Shield },
  { to: '/audit-logs', label: 'Audit Logs', icon: AlertTriangle },
  { to: '/sync', label: 'Integration Sync', icon: DatabaseZap },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">▦</div>
        <div><strong>Payroll Pro</strong><span>HR ADMIN PANEL</span></div>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={20} /> <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-user"><div className="avatar dark">AD</div><div><strong>Administrator</strong><span>Super User</span></div></div>
    </aside>
  );
}
