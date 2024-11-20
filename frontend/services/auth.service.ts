'use client';

import { environment } from '../config/environment';
import { ApiService } from './api.service';
import { API_ENDPOINTS } from '@/config/api-endpoints';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { jwtDecode } from 'jwt-decode';

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
  AccessToken?: string;
  IdToken?: string;
  RefreshToken?: string;
  ExpiresIn?: number;
}

export interface TokenClaims {
  sub: string;
  email: string;
  'cognito:groups'?: string[];
  exp: number;
}

class AuthService {
  private static instance: AuthService;
  private apiService: ApiService;
  private tokenVerifier: any;

  private constructor() {
    this.apiService = new ApiService();
    this.tokenVerifier = CognitoJwtVerifier.create({
      userPoolId: environment.COGNITO.USER_POOL_ID,
      clientId: environment.COGNITO.CLIENT_ID,
      tokenUse: 'id',
    });
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
        clientId: environment.COGNITO.CLIENT_ID
      };

      console.log('Sending registration request:', {
        ...requestBody,
        password: '[REDACTED]',
        clientId: requestBody.clientId
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

      // Store session if available
      if (response?.tokens?.Session || response?.tokens?.session) {
        localStorage.setItem('TempSession', response?.tokens?.Session || response?.tokens?.session);
        console.log('Stored TempSession');
      }

      console.log('Registration response structure:', {
        hasAccessToken: !!tokens.AccessToken,
        hasIdToken: !!tokens.IdToken,
        hasRefreshToken: !!tokens.RefreshToken,
        hasSession: !!(response?.tokens?.Session || response?.tokens?.session),
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

  public async login(email: string, password: string): Promise<UserClaims> {
    try {
      console.log('Attempting login with:', { identity: email });
      
      // Validate inputs before making request
      if (!email || !password) {
        throw new AuthError('Email and password are required');
      }

      const response = await this.apiService.login({ 
        identity: email.trim().toLowerCase(),
        password 
      });
      
      console.log('Login response:', {
        hasTokens: !!response?.tokens,
        tokenKeys: response?.tokens ? Object.keys(response.tokens) : [],
      });

      if (!response || !response.tokens) {
        console.error('Invalid login response:', response);
        throw new AuthError('Invalid response from server');
      }

      if (!this.validateTokenResponse(response.tokens)) {
        console.error('Invalid token response:', response.tokens);
        throw new AuthError('Invalid token response from server');
      }

      // Parse and log token information before storing
      const idTokenClaims = this.parseToken(response.tokens.IdToken);
      if (!idTokenClaims) {
        throw new AuthError('Failed to parse ID token');
      }

      console.log('Token claims:', {
        sub: idTokenClaims.sub,
        groups: idTokenClaims.groups,
        exp: idTokenClaims.exp
      });

      this.setTokens(response.tokens);
      
      // Verify tokens were stored
      const storedTokens = this.getTokens();
      console.log('Stored tokens verification:', {
        hasAccessToken: !!storedTokens?.AccessToken,
        hasIdToken: !!storedTokens?.IdToken,
        hasRefreshToken: !!storedTokens?.RefreshToken,
        groups: this.getUserGroup()
      });

      return idTokenClaims;
    } catch (error) {
      console.error('Login failed:', error);
      
      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new AuthError('Unable to connect to authentication service. Please check your internet connection.', 'NETWORK_ERROR');
      }
      
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new AuthError(message, error instanceof AuthError ? error.code : 'LOGIN_FAILED');
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

      // Get the temporary tokens
      const tempAccessToken = localStorage.getItem('TempAccessToken');
      
      if (!tempAccessToken) {
        throw new AuthError('No access token found. Please register again.');
      }

      console.log('Sending verification request with code:', code);

      // Backend expects code as query parameter
      const response = await this.apiService.request(`${API_ENDPOINTS.AUTH.VERIFY}?code=${code}`, {
        method: 'POST',
        credentials: 'include',  // Important for cookies
        headers: {
          'Cookie': `AccessToken=${tempAccessToken}` // Send token as cookie
        }
      });

      console.log('Email verification response:', {
        success: !!response,
        username,
        hasTokens: !!response?.tokens
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

  public getAccessToken(): string | null {
    const tokens = this.getTokens();
    if (!tokens?.AccessToken) {
      console.warn('No access token found');
      return null;
    }
    
    // Validate token expiration
    try {
      const claims = this.parseToken(tokens.AccessToken);
      if (!claims || claims.exp * 1000 < Date.now()) {
        console.warn('Access token expired');
        return null;
      }
    } catch (error) {
      console.error('Failed to validate access token:', error);
      return null;
    }
    
    return tokens.AccessToken;
  }

  public parseToken(token: string): TokenClaims | null {
    try {
      return jwtDecode<TokenClaims>(token);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  }

  public async verifyToken(token: string): Promise<boolean> {
    try {
      await this.tokenVerifier.verify(token);
      return true;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  public isTokenExpired(token: string): boolean {
    const claims = this.parseToken(token);
    if (!claims) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return claims.exp < currentTime;
  }

  public async refreshSession(): Promise<void> {
    try {
      const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Session refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.tokens);
    } catch (error) {
      console.error('Session refresh error:', error);
      throw error;
    }
  }

  public getTokens(): AuthTokens | null {
    try {
      const tokens = localStorage.getItem('tokens');
      return tokens ? JSON.parse(tokens) : null;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  }

  public setTokens(tokens: AuthTokens): void {
    localStorage.setItem('tokens', JSON.stringify(tokens));
  }

  public clearTokens(): void {
    localStorage.removeItem('tokens');
  }

  public getUserGroup(): string[] {
    const token = localStorage.getItem('IdToken');
    if (!token) return [];

    const claims = this.parseToken(token);
    // console.log('getUserGroup claims:', claims);
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

  public continueAsGuest(): void {
    localStorage.setItem('isGuest', 'true');
  }

  public isGuest(): boolean {
    return localStorage.getItem('isGuest') === 'true';
  }

  public clearGuestMode(): void {
    localStorage.removeItem('isGuest');
  }
}
