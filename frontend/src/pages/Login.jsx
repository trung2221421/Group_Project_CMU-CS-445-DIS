import { Eye, Globe2, Info, LockKeyhole, Mail, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        <section className="login-left">
          <div className="brand white"><div className="brand-logo light"><Network size={26}/></div><strong>HRM Enterprise</strong></div>
          <h1>HR & Payroll Integration Dashboard</h1>
          <p>Secure access for HR, Payroll, and Management. Manage your workforce with precision and automated intelligence.</p>
          <div className="login-quote"><div className="avatar dark">👨🏻‍💼</div><div><b>Hệ thống vận hành mượt mà</b><span>Quản trị viên hệ thống</span></div></div>
        </section>
        <section className="login-right">
          <div className="login-form">
            <h2>Chào mừng trở lại</h2><p>Vui lòng đăng nhập để tiếp tục quản lý</p>
            <label><span><Mail size={17}/> Email công ty</span><input placeholder="name@company.com" /></label>
            <label><span><LockKeyhole size={17}/> Mật khẩu <a>Quên mật khẩu?</a></span><div className="password"><input type="password" defaultValue="12345678"/><Eye size={18}/></div></label>
            <label className="remember"><input type="checkbox"/> Ghi nhớ đăng nhập</label>
            <Link to="/dashboard" className="btn primary full">Đăng nhập</Link>
            <div className="login-info"><Info size={22}/> Vui lòng chọn vai trò hoặc liên hệ quản trị viên để được cấp quyền.</div>
            <div className="sso-title">HOẶC ĐĂNG NHẬP VỚI SSO</div>
            <div className="sso"><button>Google</button><button>Microsoft</button></div>
            <footer>© 2024 Payroll Pro. All rights reserved.</footer>
          </div>
        </section>
      </div>
      <button className="language"><Globe2 size={18}/> Tiếng Việt⌄</button>
    </div>
  );
}
