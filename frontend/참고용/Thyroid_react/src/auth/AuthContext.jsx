import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(localStorage.getItem("access"));
  const [refresh, setRefresh] = useState(localStorage.getItem("refresh"));
  const [me, setMe] = useState(null);        // { username, role, ... }
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    try {
      const res = await api.get("/auth/me");
      setMe(res.data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // (옵션) 토큰 만료 체크 — 만료면 자동 로그아웃
    function isExpired(token) {
      try {
        const { exp } = jwtDecode(token); // ✅ 변경된 사용법
        if (!exp) return false;
        const now = Math.floor(Date.now() / 1000);
        return exp <= now;
      } catch {
        return true;
      }
    }

    if (access && !isExpired(access)) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [access]);

  async function login(username, password) {
    const res = await api.post("/auth/login", { username, password });
    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    setAccess(res.data.access);
    setRefresh(res.data.refresh);
    await fetchMe();
  }

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setAccess(null);
    setRefresh(null);
    setMe(null);
  }

  const value = { access, refresh, me, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
