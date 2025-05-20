import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import axios, { AxiosError } from 'axios';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshPromise = useRef<Promise<string> | null>(null);

  const clearAuth = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

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
      if (error instanceof AxiosError && error.response?.status === 401) {
        clearAuth();
      }
      return false;
    }
  };

  // Set up axios interceptors
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
          originalRequest._retry = true;
          
          try {
            let newToken: string;
            
            if (refreshPromise.current) {
              newToken = await refreshPromise.current;
            } else {
              refreshPromise.current = api.post('/auth/refresh')
                .then(response => response.data.accessToken)
                .finally(() => {
                  refreshPromise.current = null;
                });
              newToken = await refreshPromise.current;
            }
            
            if (!newToken) {
              throw new Error('No token received');
            }
            
            localStorage.setItem('token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            await fetchUser();
            
            return api(originalRequest);
          } catch (refreshError) {
            clearAuth();
            throw refreshError;
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Initial auth check
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const logout = () => {
    api.post('/auth/logout').finally(() => {
      clearAuth();
    });
  };

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        usernameOrEmail,
        password,
      });
      const { accessToken, user } = response.data;
      localStorage.setItem('token', accessToken);
      setUser(user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await api.post('/auth/register', {
        username,
        email,
        password,
        firstName,
        lastName
      });
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      setUser(user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
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