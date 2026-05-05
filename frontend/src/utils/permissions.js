export const FUNCTION_BY_ROUTE = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/employees/new': 'Employees',
  '/departments': 'Departments & Positions',
  '/payroll': 'Payroll',
  '/attendance': 'Attendance',
  '/reports': 'Reports & Analytics',
  '/alerts': 'Alerts',
  '/users': 'User Management',
  '/audit-logs': 'Audit Logs',
  '/sync': 'Integration Sync',
  '/settings': 'Settings',
};

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function getStoredAuth() {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const user = safeParse(localStorage.getItem('user'), null);
  const roles = safeParse(localStorage.getItem('roles'), []);
  const permissions = safeParse(localStorage.getItem('permissions'), []);

  return { token, user, roles, permissions };
}

export function clearStoredAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  localStorage.removeItem('roles');
  localStorage.removeItem('permissions');
}

export function saveAuthSession(data) {
  localStorage.setItem('accessToken', data.accessToken || '');
  localStorage.setItem('user', JSON.stringify(data.user || null));
  localStorage.setItem('roles', JSON.stringify(data.roles || []));
  localStorage.setItem('permissions', JSON.stringify(data.permissions || []));
}

export function getRoleName(role) {
  if (!role) return '';

  return (
    role.RoleName ||
    role.roleName ||
    role.rolename ||
    role.role_name ||
    role.Role ||
    role.role ||
    role.Name ||
    role.name ||
    ''
  );
}

export function isAdmin() {
  const { roles, user } = getStoredAuth();

  const roleNames = roles.map(getRoleName).filter(Boolean);

  if (roleNames.some((name) => normalize(name) === 'admin')) {
    return true;
  }

  const userRole =
    user?.RoleName ||
    user?.roleName ||
    user?.role_name ||
    user?.role ||
    user?.Role ||
    '';

  return normalize(userRole) === 'admin';
}

export function hasPermission(functionName, action = 'View') {
  if (!functionName) return true;

  // Admin luôn có toàn quyền
  if (isAdmin()) return true;

  const { permissions } = getStoredAuth();

  return permissions.some((item) => {
    const itemFunctionName =
      item.functionName ||
      item.FunctionName ||
      item.function_name ||
      item.Function ||
      item.function ||
      item.functionName ||
      item.permissionFunction ||
      '';

    const singleAction =
      item.PermissionName ||
      item.permissionName ||
      item.permission_name ||
      item.permission ||
      item.Permission ||
      item.Action ||
      item.action ||
      item.Name ||
      item.name ||
      '';

    const actions =
      item.actions ||
      item.Actions ||
      item.permissions ||
      item.Permissions ||
      [];

    if (normalize(itemFunctionName) !== normalize(functionName)) {
      return false;
    }

    if (normalize(singleAction) === normalize(action)) {
      return true;
    }

    // Cho phép Read tương đương View để phù hợp cách đặt permission phổ biến trong DB.
    if (normalize(action) === 'view' && normalize(singleAction) === 'read') {
      return true;
    }

    if (Array.isArray(actions)) {
      return actions.some((permission) => {
        const permissionName =
          permission.PermissionName ||
          permission.permissionName ||
          permission.permission_name ||
          permission.Action ||
          permission.action ||
          permission.Name ||
          permission.name ||
          permission;

        return normalize(permissionName) === normalize(action) || (normalize(action) === 'view' && normalize(permissionName) === 'read');
      });
    }

    return normalize(actions) === normalize(action) || (normalize(action) === 'view' && normalize(actions) === 'read');
  });
}

export function canOpenRoute(pathname) {
  if (isAdmin()) return true;

  // Dashboard luôn cho user đã đăng nhập vào
  if (pathname === '/dashboard') return true;

  const matchedPath = Object.keys(FUNCTION_BY_ROUTE)
    .sort((a, b) => b.length - a.length)
    .find((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!matchedPath) return true;

  return hasPermission(FUNCTION_BY_ROUTE[matchedPath], 'View');
}
export function hasAnyPermission(functionName, actions = ['View']) {
  return actions.some((action) => hasPermission(functionName, action));
}
