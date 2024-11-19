'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  username: string | null;
  email: string | null;
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

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      checkAuth();
      router.push('/');
    } catch (error) {
      console.error('Login failed:', error);
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
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
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
