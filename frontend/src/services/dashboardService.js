const API_URL = "http://127.0.0.1:8000";

export const getDashboard = async () => {
  const res = await fetch(`${API_URL}/dashboard`);
  return await res.json();
};