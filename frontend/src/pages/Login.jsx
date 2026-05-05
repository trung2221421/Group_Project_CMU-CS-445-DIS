import {
  Eye,
  Globe2,
  Info,
  LockKeyhole,
  LogIn,
  Mail,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { saveAuthSession } from '../utils/permissions.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.detail || data.message || 'Email hoặc mật khẩu không đúng.');
        return;
      }

      saveAuthSession(data);

      if (!remember) {
        sessionStorage.setItem('accessToken', data.accessToken);
      }

      const nextPath = location.state?.from?.pathname || '/dashboard';
      navigate(nextPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Không kết nối được API đăng nhập. Vui lòng kiểm tra backend.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f5f7fc;
    color: #111827;
  }

  .login-page {
    min-height: 100vh;
    padding: 80px 18px 28px;
    background: #f5f7fc;
    position: relative;
  }

  .login-shell {
    width: min(1180px, 100%);
    min-height: 560px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: #ffffff;
    border: 1px solid #c7ccd5;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  }

  .login-left {
    position: relative;
    padding: 48px 44px;
    color: #ffffff;
    background:
      radial-gradient(circle at 75% 35%, rgba(37, 99, 235, 0.1), transparent 32%),
      linear-gradient(135deg, #081b31 0%, #0b213b 52%, #071c31 100%);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 20px;
    font-weight: 800;
  }

  .brand-logo {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    color: #ffffff;
    background: #0b5be7;
    border-radius: 6px;
  }

  .hero-content {
    margin-top: 64px;
    max-width: 480px;
  }

  .hero-content h1 {
    margin: 0;
    font-size: clamp(32px, 3vw, 40px);
    line-height: 1.18;
    letter-spacing: -1.2px;
    font-weight: 800;
  }

  .hero-content p {
    margin: 26px 0 0;
    font-size: 18px;
    line-height: 1.55;
    color: #d4ddec;
  }

  .status-card {
    position: absolute;
    left: 44px;
    right: 44px;
    bottom: 38px;
    padding: 22px 26px;
    background: rgba(15, 35, 60, 0.72);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 8px;
  }

  .status-title {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #e5e7eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 1.4px;
  }

  .quote {
    margin: 22px 0 18px;
    color: rgba(229, 231, 235, 0.9);
    font-size: 16px;
    line-height: 1.45;
    font-style: italic;
    font-weight: 500;
  }

  .admin-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .admin-avatar {
    width: 42px;
    height: 42px;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid #2563eb;
  }

  .admin-row strong {
    display: block;
    font-size: 15px;
    color: #ffffff;
  }

  .admin-row span {
    display: block;
    margin-top: 3px;
    color: #7b8aa3;
    font-size: 14px;
  }

  .login-right {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 42px;
    background: #ffffff;
  }

  .login-form {
    width: min(410px, 100%);
  }

  .form-header {
    margin-bottom: 42px;
  }

  .form-header h2 {
    margin: 0;
    color: #111827;
    font-size: 28px;
    line-height: 1.2;
    letter-spacing: -0.7px;
    font-weight: 800;
  }

  .form-header p {
    margin: 8px 0 0;
    color: #3f4654;
    font-size: 15px;
  }

  .form-group {
    margin-bottom: 24px;
  }

  .form-group label {
    display: block;
    margin-bottom: 8px;
    color: #3f4654;
    font-size: 14px;
    font-weight: 800;
  }

  .input-wrap {
    height: 42px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 14px;
    border: 1px solid #bcc2cc;
    border-radius: 4px;
    background: #ffffff;
    color: #737b87;
  }

  .input-wrap:focus-within {
    border-color: #155ee8;
    box-shadow: 0 0 0 3px rgba(21, 94, 232, 0.12);
  }

  .input-wrap input {
    width: 100%;
    height: 100%;
    border: 0;
    outline: 0;
    color: #111827;
    font-size: 16px;
    background: transparent;
  }

  .input-wrap input::placeholder {
    color: #737b87;
  }

  .eye-button {
    display: grid;
    place-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: #737b87;
    cursor: pointer;
  }

.form-group {
  margin-bottom: 24px;
}

.password-options {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-top: 26px;
}

.remember {
  display: inline-flex !important;
  align-items: center;
  gap: 9px;
  margin: 0;
  align-items: center;
  width: fit-content;
  color: #2f3641;
  font-size: 15px;
  cursor: pointer;
  user-select: none;  
}

.remember input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: #155ee8;
  cursor: pointer;
  flex-shrink: 0;
}

.remember span {
  line-height: 1;
  white-space: nowrap;
}

  .login-button {
    width: 100%;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    border: 0;
    border-radius: 4px;
    background: #1158dc;
    color: #ffffff;
    font-size: 20px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 9px 18px rgba(17, 88, 220, 0.22);
  }

  .login-button:hover {
    background: #0f4fc8;
  }

  .login-button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  .login-info {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-top: 30px;
    padding: 16px;
    color: #303847;
    background: #eef4ff;
    border: 1px solid #d8e2f3;
    border-radius: 4px;
    font-size: 14px;
    line-height: 1.55;
  }

  .login-info svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: #1158dc;
  }

  .login-footer {
    margin-top: 34px;
    padding-top: 22px;
    border-top: 1px solid #c7ccd5;
    text-align: center;
    color: #7b818c;
    font-size: 14px;
  }

  .login-footer button {
    margin: 8px 8px 0;
    border: 0;
    background: transparent;
    color: #7b818c;
    font-size: 14px;
    cursor: pointer;
  }

  .error-message {
    margin-bottom: 18px;
    padding: 12px 14px;
    color: #991b1b;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    font-size: 14px;
  }

  .language {
    position: fixed;
    right: 30px;
    bottom: 28px;
    height: 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 22px;
    border: 1px solid #c7ccd5;
    border-radius: 12px;
    background: #ffffff;
    color: #1f2937;
    font-size: 15px;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.14);
    cursor: pointer;
  }

  .language svg {
    color: #1158dc;
  }

  .chevron {
    font-size: 18px;
    color: #6b7280;
  }

  @media (max-width: 980px) {
    .login-page {
      padding-top: 28px;
    }

    .login-shell {
      grid-template-columns: 1fr;
    }

    .login-left {
      min-height: 500px;
    }

    .status-card {
      position: static;
      margin-top: 56px;
    }
  }

  @media (max-width: 560px) {
    .login-left,
    .login-right {
      padding: 30px 22px;
    }

    .brand {
      font-size: 20px;
    }

    .hero-content {
      margin-top: 44px;
    }

    .hero-content h1 {
      font-size: 30px;
    }

    .hero-content p {
      font-size: 16px;
    }

    .language {
      right: 18px;
      bottom: 18px;
    }
  }
`}</style>

      <main className="login-page">
        <div className="login-shell">
          <section className="login-left">
            <div className="brand">
              <div className="brand-logo">
                <Network size={28} />
              </div>
              <strong>HRM Enterprise</strong>
            </div>

            <div className="hero-content">
              <h1>HR &amp; Payroll Integration Dashboard</h1>
              <p>
                Hệ thống quản trị nhân sự tập trung với độ chính xác cao,
                giúp tối ưu hóa quy trình tính lương và tuân thủ các tiêu chuẩn
                doanh nghiệp quốc tế.
              </p>
            </div>

            <div className="status-card">
              <div className="status-title">
                <ShieldCheck size={17} />
                <span>SYSTEM STATUS: SECURE</span>
              </div>

              <p className="quote">
                “Giải pháp HRM này đã chuyển đổi hoàn toàn cách chúng tôi xử lý
                dữ liệu nhân sự, giảm thiểu sai sót 99% trong các kỳ quyết toán thuế.”
              </p>

              <div className="admin-row">
                <img
                  src="https://i.pravatar.cc/80?img=47"
                  alt="Admin"
                  className="admin-avatar"
                />
                <div>
                  <strong>Admin Quản trị Hệ thống</strong>
                  <span>Enterprise Administrator</span>
                </div>
              </div>
            </div>
          </section>

          <section className="login-right">
            <form className="login-form" onSubmit={handleLogin}>
              <div className="form-header">
                <h2>Chào mừng trở lại</h2>
                <p>Vui lòng đăng nhập để tiếp tục quản lý</p>
              </div>

              {error ? <div className="error-message">{error}</div> : null}

              <div className="form-group">
                <label htmlFor="email">Email công ty</label>
                <div className="input-wrap">
                  <Mail size={22} />
                  <input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>

                <div className="input-wrap">
                  <LockKeyhole size={22} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label="Hiện/ẩn mật khẩu"
                  >
                    <Eye size={23} />
                  </button>
                </div>

                <div className="password-options">
                  <label className="remember">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                {!loading && <LogIn size={23} />}
              </button>

              <div className="login-info">
                <Info size={21} />
                <span>
                  Quyền truy cập sẽ được lấy từ AccessControlDB. Liên hệ quản trị viên
                  nếu tài khoản bị khóa hoặc quyền mã định danh.
                </span>
              </div>

              <footer className="login-footer">
                <div>© 2024 Payroll Pro. All rights reserved.</div>
                <div>
                  <button type="button">Bảo mật</button>
                  <button type="button">Điều khoản</button>
                </div>
              </footer>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}