/**
 * Authentication Context for NeuroNova.
 * Manages user authentication state and provides auth methods.
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
            // Fetch user details
            try {
              const response = await axiosClient.get('/api/auth/me');
              setUser({ ...decoded, ...response.data });
            } catch (error) {
              console.error('Failed to fetch user:', error);
              logout();
            }
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

      const { access, refresh } = response.data;

      // Store tokens
      localStorage.setItem('access', access);
      localStorage.setItem('refresh', refresh);

      // Fetch user details after login
      const userResponse = await axiosClient.get('/api/auth/me');
      const userData = userResponse.data;

      // Decode token and set user
      const decoded = jwtDecode(access);
      setUser({ ...decoded, ...userData });

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed',
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
