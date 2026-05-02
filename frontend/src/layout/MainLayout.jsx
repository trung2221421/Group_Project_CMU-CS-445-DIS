import Sidebar from '../components/layout/Sidebar.jsx';
import Header from '../components/layout/Header.jsx';

export default function MainLayout({ children, title, subtitle }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Header title={title} subtitle={subtitle} />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
