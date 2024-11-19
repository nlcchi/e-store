'use client';

import { environment } from '../config/environment';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '@/config/api-endpoints';

interface UserClaims {
  sub: string;
  email: string;
  groups: string[];
  exp: number;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  email: string;
}

interface ProfileResponse {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface RegisterResponse {
  id: string;
  username: string;
  email: string;
}

interface AuthTokens {
  IdToken: string;
  AccessToken: string;
  RefreshToken: string;
}

interface TokenClaims {
  sub: string;
  email: string;
  groups?: string[];
  exp: number;
}

class AuthError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class AuthService {
  private static instance: AuthService;
  private apiService: ApiService;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private idToken: string | null = null;
  private username: string | null = null;
  private email: string | null = null;

  private constructor() {
    this.apiService = ApiService.getInstance();
    this.loadTokens();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private loadTokens(): void {
    this.accessToken = localStorage.getItem('AccessToken');
    this.refreshToken = localStorage.getItem('RefreshToken');
    this.idToken = localStorage.getItem('IdToken');
  }

  public getTokens(): AuthTokens | null {
    if (!this.accessToken || !this.idToken || !this.refreshToken) {
      return null;
    }
    return {
      AccessToken: this.accessToken,
      IdToken: this.idToken,
      RefreshToken: this.refreshToken
    };
  }

  public async register(data: { 
    username: string; 
    email: string; 
    password: string; 
    gender: string;
  }): Promise<RegisterResponse> {
    try {
      const response = await this.apiService.request<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if ('tokens' in response && response.tokens) {
        localStorage.setItem('TempAccessToken', response.tokens.AccessToken);
        localStorage.setItem('TempIdToken', response.tokens.IdToken);
        if (response.tokens.RefreshToken) {
          localStorage.setItem('TempRefreshToken', response.tokens.RefreshToken);
        }
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  public async verifyEmail(username: string, code: string): Promise<void> {
    try {
      const tempAccessToken = localStorage.getItem('TempAccessToken');
      if (!tempAccessToken) {
        throw new Error('No temporary access token found. Please register again.');
      }

      const response = await this.apiService.request<{ tokens?: AuthTokens }>(
        `${API_ENDPOINTS.AUTH.VERIFY}?code=${code}`,
        {
          method: 'POST',
          token: tempAccessToken,
        }
      );

      if (response.tokens) {
        this.setTokens(response.tokens);
        
        localStorage.removeItem('TempAccessToken');
        localStorage.removeItem('TempIdToken');
        localStorage.removeItem('TempRefreshToken');
      } else {
        throw new Error('No tokens received after verification');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  }

  public async resendVerificationCode(username: string): Promise<void> {
    try {
      const tempAccessToken = localStorage.getItem('TempAccessToken');
      if (!tempAccessToken) {
        throw new Error('No temporary access token found. Please register again.');
      }

      await this.apiService.request(API_ENDPOINTS.AUTH.VERIFY, {
        method: 'POST',
        token: tempAccessToken,
      });
    } catch (error) {
      console.error('Failed to resend verification code:', error);
      throw error;
    }
  }

  public async login(email: string, password: string): Promise<void> {
    try {
      const response = await this.apiService.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if ('tokens' in response && response.tokens) {
        this.setTokens(response.tokens);
      } else {
        throw new Error('No tokens received');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.apiService.request(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }

  public async getProfile(): Promise<ProfileResponse> {
    try {
      return await this.apiService.request<ProfileResponse>(API_ENDPOINTS.AUTH.PROFILE, {
        method: 'GET',
        token: this.getAccessToken(),
      });
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getUsername(): string | null {
    return this.username;
  }

  public getEmail(): string | null {
    return this.email;
  }

  private setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.AccessToken;
    this.refreshToken = tokens.RefreshToken;
    this.idToken = tokens.IdToken;
    localStorage.setItem('AccessToken', tokens.AccessToken);
    localStorage.setItem('RefreshToken', tokens.RefreshToken);
    localStorage.setItem('IdToken', tokens.IdToken);
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;
    this.username = null;
    this.email = null;
    localStorage.removeItem('AccessToken');
    localStorage.removeItem('RefreshToken');
    localStorage.removeItem('IdToken');
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken && !!this.idToken;
  }

  public parseToken(token: string): TokenClaims | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const claims = JSON.parse(jsonPayload);
      return {
        sub: claims.sub,
        email: claims.email,
        groups: claims['cognito:groups'] || [],
        exp: claims.exp
      };
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }

  public getUserGroups(): string[] {
    if (!this.idToken) return [];
    const claims = this.parseToken(this.idToken);
    return claims?.groups || [];
  }

  public hasPermission(requiredGroup: string): boolean {
    const userGroups = this.getUserGroups();
    return userGroups.includes(requiredGroup);
  }

  public isAdmin(): boolean {
    return this.hasPermission(environment.COGNITO.USER_GROUPS.ADMIN);
  }

  public canManageProducts(): boolean {
    return this.hasPermission(environment.COGNITO.USER_GROUPS.MANAGE_PRODUCT);
  }
}
