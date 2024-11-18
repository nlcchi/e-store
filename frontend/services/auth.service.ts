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

class AuthError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken: string;
  TokenType?: string;
}

export class AuthService {
  private static instance: AuthService;
  private apiService: ApiService;

  private constructor() {
    this.apiService = new ApiService();
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
  ): Promise<AuthTokens> {
    try {
      // Validate inputs
      if (username.length < 3 || username.includes(' ')) {
        throw new AuthError('Username must be at least 3 characters and contain no spaces.');
      }
      
      if (!['male', 'female'].includes(gender.toLowerCase())) {
        throw new AuthError('Gender must be either "male" or "female".');
      }

      // Validate password
      if (password.length < 8) {
        throw new AuthError('Password must be at least 8 characters long.');
      }

      if (!/[A-Z]/.test(password)) {
        throw new AuthError('Password must contain at least one uppercase letter.');
      }

      if (!/[a-z]/.test(password)) {
        throw new AuthError('Password must contain at least one lowercase letter.');
      }

      if (!/[0-9]/.test(password)) {
        throw new AuthError('Password must contain at least one number.');
      }

      if (!/[@$!%*?&]/.test(password)) {
        throw new AuthError('Password must contain at least one special character (@$!%*?&).');
      }

      console.log('Registering user:', { username, email, gender });
      
      // Format request according to API requirements
      const requestBody = {
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        gender: gender.toLowerCase(),
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '3pjv7ovjv0rholpc1hpr0dn9tk'
      };

      console.log('Sending registration request:', {
        ...requestBody,
        password: '[REDACTED]'
      });

      const response = await this.apiService.request(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('Raw registration response:', {
        ...response,
        tokens: response?.tokens ? {
          ...response.tokens,
          AccessToken: '[REDACTED]',
          IdToken: '[REDACTED]',
          RefreshToken: '[REDACTED]'
        } : undefined
      });

      // Extract tokens from the nested structure
      const tokens: AuthTokens = {
        AccessToken: response?.tokens?.AccessToken || response?.tokens?.accessToken || null,
        IdToken: response?.tokens?.IdToken || response?.tokens?.idToken || null,
        RefreshToken: response?.tokens?.RefreshToken || response?.tokens?.refreshToken || null,
        TokenType: response?.tokens?.TokenType || response?.tokens?.tokenType || 'Bearer'
      };

      console.log('Registration response structure:', {
        hasAccessToken: !!tokens.AccessToken,
        hasIdToken: !!tokens.IdToken,
        hasRefreshToken: !!tokens.RefreshToken,
        tokenType: tokens.TokenType,
        responseKeys: Object.keys(response?.tokens || {})
      });

      // Store temporary tokens for verification
      if (tokens.AccessToken) {
        localStorage.setItem('TempAccessToken', tokens.AccessToken);
        console.log('Stored TempAccessToken');
      } else {
        console.warn('No AccessToken found in registration response');
      }
      if (tokens.IdToken) {
        localStorage.setItem('TempIdToken', tokens.IdToken);
        console.log('Stored TempIdToken');
      }
      if (tokens.RefreshToken) {
        localStorage.setItem('TempRefreshToken', tokens.RefreshToken);
        console.log('Stored TempRefreshToken');
      }

      // Don't store permanent tokens yet - they will be stored after email verification
      return tokens;

    } catch (error) {
      console.error('Registration failed:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }
      
      // Handle specific error cases
      if (error && typeof error === 'object') {
        // Extract error message
        let errorMessage = '';
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        }
        
        // Check for specific error conditions
        const lowerErrorMessage = errorMessage.toLowerCase();
        if (lowerErrorMessage.includes('email exists') || 
            lowerErrorMessage.includes('emailexistsexception')) {
          throw new AuthError('This email is already registered. Please use a different email or try logging in.');
        } else if (lowerErrorMessage.includes('username exists')) {
          throw new AuthError('This username is already taken. Please choose a different username.');
        } else if (lowerErrorMessage.includes('password')) {
          throw new AuthError('Password must be at least 8 characters long and contain uppercase, lowercase, numbers and special characters.');
        } else if (lowerErrorMessage.includes('invalid')) {
          throw new AuthError('Please check your input values and try again.');
        } else {
          // If we have an error message, use it
          if (errorMessage) {
            throw new AuthError(`Registration failed: ${errorMessage}`);
          }
        }
      }
      
      // Default error message
      throw new AuthError(
        'Registration failed. Please try again.',
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

  public async verifyEmail(username: string, code: string): Promise<void> {
    try {
      console.log('Verifying email for user:', username);

      // Get the temporary access token
      const tempAccessToken = localStorage.getItem('TempAccessToken');
      if (!tempAccessToken) {
        throw new AuthError('No access token found. Please register again.');
      }

      const response = await this.apiService.request(`${API_ENDPOINTS.AUTH.VERIFY}?code=${code}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempAccessToken}`
        }
      });

      console.log('Email verification response:', {
        success: !!response,
        username
      });

      if (!response) {
        throw new AuthError('Email verification failed. Please try again.');
      }

      // After successful verification, store the tokens
      if (response.tokens) {
        const tokens: AuthTokens = {
          AccessToken: response.tokens.AccessToken,
          IdToken: response.tokens.IdToken,
          RefreshToken: response.tokens.RefreshToken,
          TokenType: response.tokens.TokenType
        };

        // Store the tokens
        localStorage.setItem('AccessToken', tokens.AccessToken);
        localStorage.setItem('IdToken', tokens.IdToken);
        if (tokens.RefreshToken) {
          localStorage.setItem('RefreshToken', tokens.RefreshToken);
        }

        // Clean up temporary tokens
        localStorage.removeItem('TempAccessToken');
        localStorage.removeItem('TempIdToken');
        localStorage.removeItem('TempRefreshToken');
      }
    } catch (error) {
      console.error('Email verification failed:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }

      if (error && typeof error === 'object') {
        let errorMessage = '';
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        }

        const lowerErrorMessage = errorMessage.toLowerCase();
        if (lowerErrorMessage.includes('expired')) {
          throw new AuthError('Verification code has expired. Please request a new code.');
        } else if (lowerErrorMessage.includes('invalid') && lowerErrorMessage.includes('code')) {
          throw new AuthError('Invalid verification code. Please try again or request a new code.');
        } else if (lowerErrorMessage.includes('not found')) {
          throw new AuthError('User not found. Please register again.');
        } else if (errorMessage) {
          throw new AuthError(`Email verification failed: ${errorMessage}`);
        }
      }

      throw new AuthError('Email verification failed. Please try again.');
    }
  }

  public async resendVerificationCode(username: string): Promise<void> {
    try {
      console.log('Requesting new verification code for:', username);

      // Get the temporary access token
      const tempAccessToken = localStorage.getItem('TempAccessToken');
      if (!tempAccessToken) {
        throw new AuthError('No access token found. Please register again.');
      }

      const response = await this.apiService.request(API_ENDPOINTS.AUTH.VERIFY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempAccessToken}`
        }
      });

      console.log('New verification code requested successfully');

      if (!response) {
        throw new AuthError('Failed to request new verification code.');
      }
    } catch (error) {
      console.error('Failed to request new verification code:', error);
      
      if (error instanceof AuthError) {
        throw error;
      }

      if (error && typeof error === 'object') {
        let errorMessage = '';
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if ('error' in error) {
          errorMessage = String(error.error);
        }

        const lowerErrorMessage = errorMessage.toLowerCase();
        if (lowerErrorMessage.includes('not found')) {
          throw new AuthError('User not found. Please register again.');
        } else if (errorMessage) {
          throw new AuthError(`Failed to request new code: ${errorMessage}`);
        }
      }

      throw new AuthError('Failed to request new verification code. Please try again.');
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

  private getAccessToken(): string | null {
    const tokens = this.getTokens();
    return tokens?.AccessToken || null;
  }

  public getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem('AccessToken');
    const idToken = localStorage.getItem('IdToken');
    const refreshToken = localStorage.getItem('RefreshToken');

    if (!accessToken || !idToken || !refreshToken) {
      return null;
    }

    return {
      AccessToken: accessToken,
      IdToken: idToken,
      RefreshToken: refreshToken,
    };
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
    localStorage.removeItem('CognitoSession');
  }
}
