import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/auth.js';
import type { AuthResponse } from '../services/auth.js';
import toast from 'react-hot-toast';
import { useTheme } from './ThemeContext.js';
import { useLanguage } from './LanguageContext.js';

interface UserObj {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: 'en' | 'ur_roman' | 'ur';
  role?: 'user' | 'admin';
  createdAt?: string;
}

interface AuthContextType {
  user: UserObj | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfileState: (data: { name?: string; email?: string; avatarUrl?: string; theme?: 'light' | 'dark' | 'system'; language?: 'en' | 'ur_roman' | 'ur'; role?: 'user' | 'admin' }) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTheme } = useTheme();
  const { setLanguage } = useLanguage();
  const [user, setUser] = useState<UserObj | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize state from local storage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          if (parsedUser.language) {
            setLanguage(parsedUser.language);
          }
          if (parsedUser.theme) {
            setTheme(parsedUser.theme);
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Register event listener for session logout (triggered on API token refresh failure)
    const handleForceLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      toast.error('Session expired. Please log in again.');
    };

    window.addEventListener('auth-logout', handleForceLogout);
    return () => {
      window.removeEventListener('auth-logout', handleForceLogout);
    };
  }, [setLanguage, setTheme]);

  const handleAuthSuccess = (data: AuthResponse) => {
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.user.theme) {
      setTheme(data.user.theme);
    }
    if (data.user.language) {
      setLanguage(data.user.language);
    }
  };

  const login = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      handleAuthSuccess(res);
      toast.success(`Welcome back, ${res.user.name}`);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      handleAuthSuccess(res);
      toast.success('Registration successful. Welcome to Al-Kitab!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed.';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (navigator.onLine) {
        await authApi.logout(refreshToken);
      }
    } catch (error) {
      console.warn('Backend logout failed or was offline:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      toast.success('Successfully logged out');
    }
  };

  const updateProfileState = (updatedUser: { name?: string; email?: string; avatarUrl?: string; theme?: 'light' | 'dark' | 'system'; language?: 'en' | 'ur_roman' | 'ur'; role?: 'user' | 'admin' }) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout, updateProfileState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
