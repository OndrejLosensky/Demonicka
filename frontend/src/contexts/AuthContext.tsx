import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types/user';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name: string | null, gender: 'MALE' | 'FEMALE') => Promise<void>;
  completeRegistration: (token: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = 'http://localhost:3000/api';

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to set the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch user from /me
  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        setUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching user:', error);
      return false;
    }
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  // Initial auth check
  useEffect(() => {
    fetchUser().finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        username,
        password,
      });
      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, password: string, name: string | null, gender: 'MALE' | 'FEMALE') => {
    try {
      const response = await api.post('/auth/register', {
        username,
        password,
        ...(name ? { name } : {}),
        gender
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const completeRegistration = async (token: string, username: string, password: string) => {
    try {
      const response = await api.post('/auth/complete-registration', {
        registrationToken: token,
        username,
        password,
      });
      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.user);
    } catch (error) {
      console.error('Registration completion failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('access_token');
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, completeRegistration, logout, isLoading, hasRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}