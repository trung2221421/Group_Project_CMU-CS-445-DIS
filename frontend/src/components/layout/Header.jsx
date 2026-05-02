import { Bell, CircleHelp, Grid3X3, Search } from 'lucide-react';

export default function Header({ title, subtitle }) {
  return (
    <header className="topbar">
      <div><h1>{title}</h1>{subtitle ? <p>{subtitle}</p> : null}</div>
      <div className="top-actions">
        <label className="search"><Search size={17} /><input placeholder="Tìm kiếm nhân viên, báo cáo..." /></label>
        <Bell size={21} /><CircleHelp size={21} /><Grid3X3 size={21} />
      </div>
    </header>
  );
}
