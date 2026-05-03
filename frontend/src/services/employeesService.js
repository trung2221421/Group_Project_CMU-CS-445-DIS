// employeesService.js
const API_URL = "http://localhost:8000/api";

export const getEmployees = async (dept = "", role = "") => {
  const params = new URLSearchParams();
  if (dept) params.append("dept", dept);
  if (role) params.append("role", role);

  const url = `${API_URL}/employees${params.toString() ? "?" + params : ""}`;   

  const res = await fetch(url);

  if (!res.ok) {
    console.error("getEmployees failed:", res.status, await res.text());
    return [];
  }

  const response = await res.json();

  // ✅ Handle cả 2 case: array thẳng hoặc paginated object
  const items = Array.isArray(response)
    ? response
    : (response.data ?? response.items ?? []);

  return items.map(e => ({
    ...e,
    initials: e.name
      ? e.name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase()
      : "?",
  }));
};

// employeesService.js
export const getFilters = async () => {
  try {
    console.log('Fetching filters from:', `${API_URL}/employees/filters`);
    const res = await fetch(`${API_URL}/employees/filters`);
    
    console.log('Filters response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Filters API error:', res.status, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    
    const data = await res.json();
    console.log('Filters data received:', data);
    return data;
  } catch (error) {
    console.error('getFilters failed:', error);
    // Trả về default thay vì empty để dễ debug
    return { 
      departments: ['Lỗi tải dữ liệu'], 
      roles: ['Lỗi tải dữ liệu'] 
    };
  }
};