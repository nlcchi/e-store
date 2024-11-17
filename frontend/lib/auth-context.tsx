'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string | null;
  register: (username: string, email: string, password: string, gender: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const authService = AuthService.getInstance();

  const register = useCallback(
    async (username: string, email: string, password: string, gender: string) => {
      setIsLoading(true);
      try {
        await authService.register(username, email, password, gender);
        toast.success('Registration successful! Please login.');
        router.push('/login');
      } catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Registration failed. Please try again.');
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        await authService.login(email, password);
        setIsAuthenticated(true);
        toast.success('Login successful!');
        router.push('/');
      } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Login failed. Please try again.');
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setUsername(null);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Logout failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const value = {
    isAuthenticated,
    isLoading,
    username,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
