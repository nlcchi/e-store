'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  username: string | null;
  email: string | null;
  register: (username: string, email: string, password: string, gender: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (username: string, code: string) => Promise<void>;
  resendVerificationCode: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
          setIsLoading(false);
          return;
        }
      }
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUsername(null);
      setEmail(null);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUsername(null);
      setEmail(null);
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, gender: string) => {
    try {
      const response = await authService.register({ username, email, password, gender });
      toast.success('Registration successful! Please check your email for verification code.');
      router.push(`/verify?username=${encodeURIComponent(username)}`);
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await authService.login(email, password);
      toast.success('Successfully logged in!');
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUsername(null);
      setEmail(null);
      setIsLoading(false);
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const verifyEmail = async (username: string, code: string) => {
    try {
      await authService.verifyEmail(username, code);
      toast.success('Email verified successfully! You can now log in.');
      router.push('/login');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const resendVerificationCode = async (username: string) => {
    try {
      await authService.resendVerificationCode(username);
      toast.success('Verification code resent. Please check your email.');
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Auth error:', error);
    toast.error('Authentication failed. Please try again.');
  };

  const value = {
    isAuthenticated,
    isLoading,
    isAdmin,
    username,
    email,
    register,
    login,
    logout,
    verifyEmail,
    resendVerificationCode,
  };

  return (
    <AuthContext.Provider value={value}>
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
