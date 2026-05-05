const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${API_ROOT}/api/audit-logs`;

function getAuthHeaders(extra = {}) {
  const token =
    localStorage.getItem('accessToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken');

  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJson(res) {
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API không trả JSON hợp lệ: ${text.slice(0, 120)}`);
  }
}

export async function getAuditLogs(filters = {}) {
  const params = new URLSearchParams();

  if (filters.action) params.append('action', filters.action);
  if (filters.module) params.append('module', filters.module);
  if (filters.username) params.append('username', filters.username);

  params.append('limit', String(filters.limit || 200));

  const url = `${API_BASE}/?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseJson(res);
}

export async function trackAuditAction({
  action,
  module,
  detail,
  targetType = null,
  targetId = null,
  oldValue = null,
  newValue = null,
  status = 'SUCCESS',
}) {
  const res = await fetch(`${API_BASE}/track`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      action,
      module,
      detail,
      target_type: targetType,
      target_id: targetId,
      old_value: oldValue,
      new_value: newValue,
      status,
    }),
  });

  return parseJson(res);
}

export function trackAuditActionSafe(payload) {
  trackAuditAction(payload).catch((error) => {
    console.warn('Không thể ghi audit log:', error);
  });
}