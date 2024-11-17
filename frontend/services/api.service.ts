'use client';

import { environment } from '../config/environment';
import { API_ENDPOINTS } from '../config/api-endpoints';

interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken: string;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

interface ApiError {
  message: string;
  code?: string;
}

export class ApiService {
  private static instance: ApiService | null = null;
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl = `${environment.API_BASE_URL}v1`;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { requiresAuth = false, ...fetchOptions } = options;
    const headers = new Headers(fetchOptions.headers);

    // Set default headers
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    
    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const requestOptions: RequestInit = {
      ...fetchOptions,
      headers,
      credentials: 'include',
      mode: 'cors',
    };

    try {
      console.log('Request:', {
        url: `${this.baseUrl}${endpoint}`,
        method: requestOptions.method,
        headers: Object.fromEntries(headers.entries()),
        body: requestOptions.body,
      });

      const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
      let data;
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          // Try to parse the text as JSON even if content-type is not set
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      console.log('Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      });

      if (!response.ok) {
        let errorMessage = 'An error occurred';
        let errorCode = undefined;

        if (typeof data === 'object' && data !== null) {
          // Handle AWS API Gateway error format
          if ('message' in data) {
            errorMessage = data.message;
          } else if ('Message' in data) {
            errorMessage = data.Message;
          }
          
          if ('code' in data) {
            errorCode = data.code;
          } else if ('Code' in data) {
            errorCode = data.Code;
          }
        } else if (typeof data === 'string' && data.length > 0) {
          errorMessage = data;
        }

        const error: ApiError = {
          message: errorMessage,
          code: errorCode,
        };
        
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API request failed:', {
        error,
        isError: error instanceof Error,
        errorType: error?.constructor?.name,
        errorProps: Object.getOwnPropertyNames(error || {}),
      });

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Please check your internet connection');
      }

      // If it's already an ApiError, rethrow it
      if (error && typeof error === 'object' && 'message' in error) {
        throw error;
      }

      // Otherwise, wrap it in an ApiError
      throw {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  private async getAuthToken(): Promise<string | null> {
    return localStorage.getItem('IdToken');
  }

  // Auth endpoints
  public async register(data: {
    username: string;
    email: string;
    password: string;
    gender: string;
  }) {
    return this.request(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async login(credentials: LoginCredentials): Promise<{
    tokens: AuthTokens;
    username: string;
  }> {
    return this.request<{ tokens: AuthTokens; username: string }>(
      API_ENDPOINTS.AUTH.LOGIN,
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
  }

  public async logout() {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      requiresAuth: true,
    });
  }

  public async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.request<AuthTokens>(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Product endpoints
  public async getProducts() {
    return this.request(API_ENDPOINTS.PRODUCTS.LIST, {
      method: 'GET',
    });
  }

  public async getProduct(id: string) {
    return this.request(`${API_ENDPOINTS.PRODUCTS.DETAIL}/${id}`, {
      method: 'GET',
    });
  }

  // Add other API methods as needed
}
