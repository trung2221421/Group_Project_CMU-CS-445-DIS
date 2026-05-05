const API_URL = "http://localhost:8000/api";

export const getEmployees = async (dept = "", role = "") => {
  const params = new URLSearchParams();
  if (dept) params.append("dept", dept);
  if (role) params.append("role", role);

  const url = `${API_URL}/employees${params.toString() ? "?" + params : ""}`;

  const res = await fetch(url); // Không cần header X-User

  if (!res.ok) {
    console.error("getEmployees failed:", res.status, await res.text());
    return [];
  }

  const response = await res.json();
  const items = Array.isArray(response) ? response : (response.data ?? response.items ?? []);
  return items.map(e => ({
    ...e,
    initials: e.name ? e.name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase() : "?",
  }));
};

export const getFilters = async () => {
  try {
    const res = await fetch(`${API_URL}/employees/filters`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    return await res.json();
  } catch (error) {
    console.error('getFilters failed:', error);
    return { departments: [], roles: [] };
  }
};