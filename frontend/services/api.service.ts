'use client';

import { environment } from '../config/environment';
import { API_ENDPOINTS } from '../config/api-endpoints';

interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken: string;
}

interface LoginCredentials {
  identity: string;
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
    // Remove trailing slash if present
    this.baseUrl = environment.API_BASE_URL.replace(/\/$/, '');
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private getFullUrl(endpoint: string): string {
    // Remove leading slash from endpoint
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    return `${this.baseUrl}/${cleanEndpoint}`;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = this.getFullUrl(endpoint);
    
    // Ensure headers and CORS settings are set
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      const requestBody = options.body ? JSON.parse(options.body as string) : undefined;
      console.log(`API request to ${endpoint}:`, {
        method: options.method,
        url,
        headers: {
          ...headers,
          Cookie: headers['Cookie'] ? '[REDACTED]' : undefined
        },
        body: requestBody ? {
          ...requestBody,
          password: requestBody.password ? '[REDACTED]' : undefined,
          code: requestBody.code ? '[REDACTED]' : undefined
        } : undefined,
        credentials: options.credentials
      });

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors'
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log('API response data:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: typeof data === 'object' ? {
          ...data,
          // Redact sensitive data
          accessToken: data?.accessToken ? '[REDACTED]' : undefined,
          AccessToken: data?.AccessToken ? '[REDACTED]' : undefined,
          idToken: data?.idToken ? '[REDACTED]' : undefined,
          IdToken: data?.IdToken ? '[REDACTED]' : undefined,
          session: data?.session ? '[REDACTED]' : undefined,
          Session: data?.Session ? '[REDACTED]' : undefined,
        } : data
      });

      if (!response.ok) {
        console.error('API error details:', {
          status: response.status,
          statusText: response.statusText,
          url,
          endpoint,
          error: typeof data === 'object' ? data : { message: data },
          requestBody: requestBody ? {
            ...requestBody,
            password: '[REDACTED]',
            code: '[REDACTED]'
          } : undefined
        });

        // Handle specific error cases
        if (response.status === 400) {
          if (typeof data === 'object' && data !== null) {
            if (data.message) {
              throw new Error(data.message);
            } else if (data.error) {
              throw new Error(data.error);
            }
          }
          throw new Error('Invalid request. Please check your input values.');
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        } else if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        } else if (response.status === 404) {
          throw new Error('The requested resource was not found.');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }

        throw new Error(`Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', {
        error,
        endpoint,
        url,
        request: {
          method: options.method,
          headers: {
            ...headers,
            Cookie: headers['Cookie'] ? '[REDACTED]' : undefined
          },
          body: options.body ? {
            ...JSON.parse(options.body as string),
            password: '[REDACTED]',
            code: '[REDACTED]'
          } : undefined,
          credentials: options.credentials
        }
      });

      throw error;
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

  public async getProfile() {
    return this.request(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
      requiresAuth: true,
    });
  }

  // Product endpoints
  public async getProducts() {
    return this.request(API_ENDPOINTS.PRODUCTS.LIST, {
      method: 'GET',
    });
  }

  public async getProduct(id: string) {
    return this.request(API_ENDPOINTS.PRODUCTS.DETAIL(id), {
      method: 'GET',
    });
  }

  // Payment endpoints
  public async initiateCheckout(data: { 
    orders: Array<{ productId: string; count: number }>;
    location: { country: string; address: string };
  }): Promise<{ url: string }> {
    return this.request(API_ENDPOINTS.PAYMENT.CHECKOUT, {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
      requiresAuth: true
    });
  }

  // Add other API methods as needed
}
