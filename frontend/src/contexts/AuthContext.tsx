import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User, UserRole } from '../types/user';
import { toast } from 'react-hot-toast';
import { apiClient } from '../utils/apiClient';
import type { AxiosError } from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

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

interface ApiErrorResponse {
  message: string;
  statusCode: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to fetch user from /me
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        return false;
      }

      const response = await apiClient.get('/auth/me');
      if (response.data) {
        setUser(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error fetching user:', error);
      // Clear invalid token
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('access_token');
        setUser(null);
        // Only redirect to login if we're not already there and not on a public route
        if (!location.pathname.startsWith('/login') && 
            !location.pathname.startsWith('/register') && 
            !location.pathname.startsWith('/complete-registration')) {
          navigate('/login');
        }
      }
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
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error('Přihlášení se nezdařilo');
      }
      throw error;
    }
  };

  const register = async (username: string, password: string, name: string | null, gender: 'MALE' | 'FEMALE') => {
    try {
      const response = await apiClient.post('/auth/register', {
        username,
        password,
        ...(name ? { name } : {}),
        gender
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Registration failed:', error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error('Registrace se nezdařila');
      }
      throw error;
    }
  };

  const completeRegistration = async (token: string, username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/complete-registration', {
        registrationToken: token,
        username,
        password,
      });
      localStorage.setItem('access_token', response.data.access_token);
      setUser(response.data.user);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration completion failed:', error);
      const axiosError = error as AxiosError<ApiErrorResponse>;
      if (axiosError.response?.data?.message) {
        toast.error(axiosError.response.data.message);
      } else {
        toast.error('Dokončení registrace se nezdařilo');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
      navigate('/login');
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