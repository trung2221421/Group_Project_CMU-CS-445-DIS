import { Navigate, useLocation } from 'react-router-dom';
import { canOpenRoute, getStoredAuth, isAdmin } from '../utils/permissions.js';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { token } = getStoredAuth();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Admin luôn được vào tất cả trang
  if (isAdmin()) {
    return children;
  }

  // Dashboard cho phép vào sau khi đăng nhập để tránh vòng lặp trắng màn hình
  if (location.pathname === '/dashboard') {
    return children;
  }

  if (!canOpenRoute(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}