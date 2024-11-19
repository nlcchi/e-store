'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string | null;
  email: string | null;
  register: (username: string, email: string, password: string, gender: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const authService = AuthService.getInstance();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const tokens = authService.getTokens();
      if (tokens?.IdToken) {
        const claims = authService.parseToken(tokens.IdToken);
        if (claims) {
          setIsAuthenticated(true);
          setIsAdmin(authService.isAdmin());
          setUsername(authService.getUsername());
          setEmail(authService.getEmail());
          return;
        }
      }
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUsername(null);
      setEmail(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUsername(null);
      setEmail(null);
    }
  };

  const register = async (username: string, email: string, password: string, gender: string) => {
    try {
      await authService.register({ username, email, password, gender });
      toast.success('Registration successful! Please log in.');
      router.push('/login');
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed. Please try again.');
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      checkAuth();
      toast.success('Login successful!');
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('Login failed. Please try again.');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUsername(null);
      setEmail(null);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed. Please try again.');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        username,
        email,
        register,
        login,
        logout,
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
