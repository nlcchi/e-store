'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AuthService } from '@/services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    gender: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkAuth = () => {
      const token = authService.getAccessToken();
      setIsAuthenticated(!!token);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      setIsAuthenticated(true);
      router.push('/');
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, [router]);

  const register = useCallback(async (data: {
    username: string;
    email: string;
    password: string;
    gender: string;
  }) => {
    try {
      await authService.register(
        data.username,
        data.email,
        data.password,
        data.gender
      );
      router.push('/login');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      router.push('/login');
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        register,
      }}
    >
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
