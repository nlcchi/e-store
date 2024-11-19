'use client';

import { API_ENDPOINTS } from '@/config/api-endpoints';
import { environment } from '@/config/environment';
import { ApiService } from './api.service';

export interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken?: string;
}

interface LoginResponse {
  tokens: AuthTokens;
  username: string;
  email: string;
}

interface RegisterResponse {
  tokens: AuthTokens;
  username: string;
  email: string;
}

interface ProfileResponse {
  username: string;
  email: string;
  groups?: string[];
}

interface TokenClaims {
  sub: string;
  email: string;
  groups?: string[];
  exp: number;
}

const STORAGE_KEY = 'auth-tokens';

export class AuthService {
  private static instance: AuthService;
  private apiService: ApiService;
  private accessToken: string | null = null;
  private idToken: string | null = null;
  private refreshToken: string | null = null;
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
    if (typeof window === 'undefined') {
      // Server-side, no tokens available
      this.accessToken = null;
      this.refreshToken = null;
      this.idToken = null;
      return;
    }

    try {
      const tokens = localStorage.getItem(STORAGE_KEY);
      if (tokens) {
        const parsed = JSON.parse(tokens);
        this.accessToken = parsed.accessToken;
        this.refreshToken = parsed.refreshToken ?? null;
        this.idToken = parsed.idToken;
      }
    } catch (error) {
      console.error('Failed to load tokens:', error);
      this.clearTokens();
    }
  }

  private setTokens(tokens: AuthTokens): void {
    if (typeof window === 'undefined') {
      return; // Don't try to use localStorage on server
    }

    this.accessToken = tokens.AccessToken;
    this.refreshToken = tokens.RefreshToken ?? null;
    this.idToken = tokens.IdToken;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        idToken: this.idToken
      }));
    } catch (error) {
      console.error('Failed to save tokens:', error);
    }
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear tokens:', error);
      }
    }
  }

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public getTokens(): AuthTokens | null {
    if (!this.accessToken || !this.idToken) return null;
    return {
      AccessToken: this.accessToken,
      IdToken: this.idToken,
      ...(this.refreshToken ? { RefreshToken: this.refreshToken } : {})
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

      if (response.tokens) {
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

      const response = await this.apiService.request<{ tokens: AuthTokens }>(
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

  public async login(username: string, password: string): Promise<void> {
    try {
      console.log('Attempting login with:', { username });
      const response = await this.apiService.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password
          },
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: environment.COGNITO.CLIENT_ID
        }),
      });

      if (response.tokens) {
        this.setTokens(response.tokens);
        this.username = response.username;
        this.email = response.email;
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
      this.clearTokens();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
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

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  public getUsername(): string | null {
    return this.username;
  }

  public getEmail(): string | null {
    return this.email;
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
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  public isAdmin(): boolean {
    if (!this.idToken) return false;
    const claims = this.parseToken(this.idToken);
    return claims?.groups?.includes(environment.COGNITO.USER_GROUPS.ADMIN) || false;
  }

  public canManageProducts(): boolean {
    if (!this.idToken) return false;
    const claims = this.parseToken(this.idToken);
    return (
      claims?.groups?.includes(environment.COGNITO.USER_GROUPS.MANAGE_PRODUCT) ||
      this.isAdmin() ||
      false
    );
  }
}
