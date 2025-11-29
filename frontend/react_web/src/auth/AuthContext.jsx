/**
 * Authentication Context for NeuroNova.
 * Manages user authentication state and provides auth methods.
 * Optimized to use JWT payload directly, reducing API calls.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access');
      if (token) {
        try {
          const decoded = jwtDecode(token);

          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            // ✅ OPTIMIZATION: Use JWT payload directly instead of API call
            // Django CustomTokenObtainPairSerializer includes: role, groups, email, username, phone_number
            setUser(decoded);
          }
        } catch (error) {
          console.error('Invalid token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axiosClient.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      });

      const { access, refresh, user: userInfo } = response.data;

      // Store tokens
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);

      // ✅ OPTIMIZATION: Decode token and merge with response user  info
      // No need for additional /profiles/me/ API call
      const decoded = jwtDecode(access);

      // Merge token claims with user data from login response
      // Django sends: { access, refresh, user: { id, username, email, role, groups } }
      const userData = {
        ...decoded,        // JWT payload: role, groups, email, username, phone_number
        ...userInfo,       // Response data: id, username, email, role, groups
      };

      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      let errorMessage = '로그인에 실패했습니다.';

      if (error.response?.status === 401) {
        errorMessage = '아이디 또는 비밀번호가 올바르지 않습니다.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = '서버와의 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.';
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
    window.location.href = '/login';
  };

  // Helper function to check if user has a specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Helper function to check if user belongs to a specific group
  const hasGroup = (groupName) => {
    return user?.groups?.includes(groupName) || false;
  };

  // Helper function to check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    hasGroup,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
