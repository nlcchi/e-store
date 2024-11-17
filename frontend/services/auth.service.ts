'use client';

import { environment } from '../config/environment';
import { ApiService } from './api.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
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

  public async login(email: string, password: string): Promise<void> {
    try {
      const response = await this.apiService.login({ email, password });
      if (!this.validateTokenResponse(response)) {
        throw new AuthError('Invalid token response from server');
      }
      this.setTokens(response);
    } catch (error) {
      console.error('Login failed:', error);
      throw new AuthError(
        error instanceof Error ? error.message : 'Login failed',
        'LOGIN_FAILED'
      );
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
      const refreshToken = localStorage.getItem('refreshToken');
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

  private validateTokenResponse(response: unknown): response is AuthTokens {
    return (
      typeof response === 'object' &&
      response !== null &&
      'accessToken' in response &&
      'refreshToken' in response &&
      typeof response.accessToken === 'string' &&
      typeof response.refreshToken === 'string'
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
    const token = localStorage.getItem('accessToken');
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
    const token = this.getAccessToken();
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
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}
