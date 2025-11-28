import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false,
});

// 토큰 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // ML 서비스 API-Key는 백엔드가 붙여서 프록시하므로 프런트에서 신경 안 씀.
  return config;
});

export default api;
