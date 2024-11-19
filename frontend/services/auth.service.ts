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
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private username: string | null = null;
  private email: string | null = null;

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
  ): Promise<RegisterResponse> {
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
        clientId: environment.COGNITO.CLIENT_ID
      };

      console.log('Sending registration request:', {
        ...requestBody,
        password: '[REDACTED]',
        clientId: requestBody.clientId
      });

      const response = await this.apiService.request<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      console.log('Raw registration response:', response);

      return response;
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
      const response = await this.apiService.request<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      this.setTokens(response.accessToken, response.refreshToken);
      this.username = response.username;
      this.email = response.email;
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

  private setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.username = null;
    this.email = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}
