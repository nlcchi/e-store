'use client';

import { environment } from '../config/environment';
import { ApiService } from './api.service';

interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken: string;
}

interface UserClaims {
  sub: string;
  email: string;
  groups: string[];
  exp: number;
}

class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  private static instance: AuthService;
  private apiService: ApiService;

  private constructor() {
    this.apiService = ApiService.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async register(
    username: string,
    email: string,
    password: string,
    gender: string
  ): Promise<void> {
    try {
      console.log('Registering user:', {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        gender: gender.toLowerCase(),
        password: '[REDACTED]'
      });

      await this.apiService.register({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
        gender: gender.toLowerCase(),
      });
    } catch (error) {
      console.error('Registration failed:', {
        error,
        isError: error instanceof Error,
        errorType: error?.constructor?.name,
        errorProps: Object.getOwnPropertyNames(error || {}),
      });
      
      // Handle specific API errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message).toLowerCase();
        
        if (message.includes('username exists')) {
          throw new AuthError('Username already exists');
        } else if (message.includes('email exists')) {
          throw new AuthError('Email already exists');
        } else if (message.includes('invalid password')) {
          throw new AuthError(
            'Password must be at least 6 characters long and contain uppercase, lowercase, numbers, and special characters'
          );
        } else if (message.includes('invalid parameter')) {
          throw new AuthError('Invalid parameters. Please check your input.');
        } else {
          // Pass through the API error message
          throw new AuthError(error.message);
        }
      }

      // Handle unknown errors
      throw new AuthError(
        'Registration failed. Please try again later.',
        'REGISTRATION_FAILED'
      );
    }
  }

  public async login(email: string, password: string): Promise<void> {
    try {
      console.log('Attempting login with:', { username: email });
      const response = await this.apiService.login({ 
        username: email, // Use email as username
        password 
      });
      
      if (!this.validateTokenResponse(response.tokens)) {
        throw new AuthError('Invalid token response from server');
      }
      this.setTokens(response.tokens);
    } catch (error) {
      console.error('Login failed:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new AuthError(message, 'LOGIN_FAILED');
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.apiService.logout();
      this.clearTokens();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  public async refreshTokens(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('RefreshToken');
      if (!refreshToken) {
        throw new AuthError('No refresh token available', 'NO_REFRESH_TOKEN');
      }
      
      const response = await this.apiService.refreshToken(refreshToken);
      if (!this.validateTokenResponse(response)) {
        throw new AuthError('Invalid token response from server');
      }
      this.setTokens(response);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens(); // Clear invalid tokens
      throw new AuthError(
        error instanceof Error ? error.message : 'Token refresh failed',
        'REFRESH_FAILED'
      );
    }
  }

  private validateTokenResponse(tokens: unknown): tokens is AuthTokens {
    return (
      typeof tokens === 'object' &&
      tokens !== null &&
      'AccessToken' in tokens &&
      'IdToken' in tokens &&
      'RefreshToken' in tokens &&
      typeof tokens.AccessToken === 'string' &&
      typeof tokens.IdToken === 'string' &&
      typeof tokens.RefreshToken === 'string'
    );
  }

  private parseToken(token: string): UserClaims | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }

  public getAccessToken(): string | null {
    const token = localStorage.getItem('AccessToken');
    if (!token) return null;

    const claims = this.parseToken(token);
    if (!claims) return null;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp <= now) {
      this.clearTokens();
      return null;
    }

    return token;
  }

  public getUserGroup(): string[] {
    const token = localStorage.getItem('IdToken');
    if (!token) return [];

    const claims = this.parseToken(token);
    return claims?.groups || [];
  }

  public hasPermission(requiredGroup: string): boolean {
    const userGroups = this.getUserGroup();
    return userGroups.includes(requiredGroup);
  }

  public isAdmin(): boolean {
    return this.hasPermission(environment.COGNITO.USER_GROUPS.ADMIN);
  }

  public canManageProducts(): boolean {
    return this.hasPermission(environment.COGNITO.USER_GROUPS.MANAGE_PRODUCT);
  }

  private setTokens(tokens: AuthTokens): void {
    localStorage.setItem('AccessToken', tokens.AccessToken);
    localStorage.setItem('IdToken', tokens.IdToken);
    localStorage.setItem('RefreshToken', tokens.RefreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('AccessToken');
    localStorage.removeItem('IdToken');
    localStorage.removeItem('RefreshToken');
  }
}
