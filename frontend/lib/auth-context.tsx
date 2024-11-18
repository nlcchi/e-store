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
  verifyEmail: (username: string, code: string) => Promise<void>;
  resendVerificationCode: (username: string) => Promise<void>;
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
        console.log('Starting registration process...');
        const response = await authService.register(username, email, password, gender);
        
        console.log('Registration response received:', {
          hasAccessToken: !!response?.AccessToken,
          hasIdToken: !!response?.IdToken,
          hasRefreshToken: !!response?.RefreshToken,
          tokenType: response?.TokenType
        });

        if (response?.AccessToken && response?.IdToken) {
          // Store username for the verification step
          setUsername(username);
          
          // Store temporary tokens for verification
          localStorage.setItem('TempAccessToken', response.AccessToken);
          localStorage.setItem('TempIdToken', response.IdToken);
          localStorage.setItem('TempRefreshToken', response.RefreshToken);
          
          // Success message and redirect to verification
          toast.success('Registration successful! Please verify your email to continue.');
          router.push(`/verify?username=${encodeURIComponent(username)}`);
        } else {
          console.error('Missing required tokens in registration response');
          toast.error('Registration failed: Authentication tokens not received');
          throw new Error('Registration failed: Authentication tokens not received');
        }
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

  const verifyEmail = useCallback(
    async (username: string, code: string) => {
      setIsLoading(true);
      try {
        await authService.verifyEmail(username, code);
        
        // After successful verification, move temporary tokens to permanent storage
        const tempAccessToken = localStorage.getItem('TempAccessToken');
        const tempIdToken = localStorage.getItem('TempIdToken');
        const tempRefreshToken = localStorage.getItem('TempRefreshToken');
        
        if (tempAccessToken && tempIdToken) {
          localStorage.setItem('AccessToken', tempAccessToken);
          localStorage.setItem('IdToken', tempIdToken);
          if (tempRefreshToken) {
            localStorage.setItem('RefreshToken', tempRefreshToken);
          }
          
          // Clear temporary tokens
          localStorage.removeItem('TempAccessToken');
          localStorage.removeItem('TempIdToken');
          localStorage.removeItem('TempRefreshToken');
          
          setIsAuthenticated(true);
          toast.success('Email verified successfully! You are now logged in.');
          router.push('/');
        } else {
          toast.error('Verification failed: Missing authentication tokens');
          router.push('/login');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Email verification failed. Please try again.');
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const resendVerificationCode = useCallback(async (username: string) => {
    setIsLoading(true);
    try {
      await authService.resendVerificationCode(username);
      toast.success('Verification code sent! Please check your email.');
    } catch (error) {
      console.error('Resend code error:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to resend code. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    username,
    register,
    login,
    logout,
    verifyEmail,
    resendVerificationCode,
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
