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

interface ProfileResponse {
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
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

  private logRequest(
    url: string,
    method: string,
    headers: HeadersInit,
    requestBody?: any
  ) {
    const logData = {
      url,
      method,
      headers: {
        ...headers,
        cookie: (headers as any).cookie ? '[REDACTED]' : undefined
      },
      body: requestBody ? {
        ...requestBody,
        password: requestBody.password ? '[REDACTED]' : undefined,
        code: requestBody.code ? '[REDACTED]' : undefined
      } : undefined
    };

    console.log('API Request:', logData);
  }

  private logResponse(response: any) {
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
  }

  private async request<T = any>(
    endpoint: string,
    options: {
      method?: string;
      headers?: HeadersInit;
      body?: any;
      credentials?: RequestCredentials;
      requiresAuth?: boolean;
    } = {}
  ): Promise<T> {
    const url = this.getFullUrl(endpoint);
    
    // Ensure headers and CORS settings are set
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    try {
      const requestBody = options.body ? JSON.parse(options.body as string) : undefined;
      this.logRequest(url, options.method || 'GET', headers, requestBody);

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      let data: T;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as T;
      }

      this.logResponse({
        status: response.status,
        data: typeof data === 'object' ? {
          ...data,
          // Redact sensitive data
          accessToken: (data as any)?.accessToken ? '[REDACTED]' : undefined,
          AccessToken: (data as any)?.AccessToken ? '[REDACTED]' : undefined,
          idToken: (data as any)?.idToken ? '[REDACTED]' : undefined,
          IdToken: (data as any)?.IdToken ? '[REDACTED]' : undefined,
          refreshToken: (data as any)?.refreshToken ? '[REDACTED]' : undefined,
          RefreshToken: (data as any)?.RefreshToken ? '[REDACTED]' : undefined,
          sessionToken: (data as any)?.sessionToken ? '[REDACTED]' : undefined,
          SessionToken: (data as any)?.SessionToken ? '[REDACTED]' : undefined,
          password: (data as any)?.password ? '[REDACTED]' : undefined,
          code: (data as any)?.code ? '[REDACTED]' : undefined
        } : data
      });

      if (!response.ok) {
        throw new Error((data as any)?.message || 'API request failed');
      }

      return data;
    } catch (error: any) {
      console.error('API request error:', {
        url,
        request: {
          method: options.method,
          headers: {
            ...headers,
            cookie: (headers as any).cookie ? '[REDACTED]' : undefined
          },
          body: options.body ? {
            ...JSON.parse(options.body as string),
            password: '[REDACTED]',
            code: '[REDACTED]'
          } : undefined,
          credentials: options.credentials
        },
        error: {
          message: error.message,
          stack: error.stack
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

  public async getProfile(): Promise<ProfileResponse> {
    return this.request<ProfileResponse>(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
      requiresAuth: true,
    });
  }

  // Product endpoints
  public async getProduct(id: string): Promise<Product> {
    return this.request<Product>(API_ENDPOINTS.PRODUCTS.DETAIL(id), {
      method: 'GET',
    });
  }

  public async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    return this.request<Product>(API_ENDPOINTS.PRODUCTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async deleteProduct(id: string): Promise<void> {
    return this.request<void>(API_ENDPOINTS.PRODUCTS.DELETE(id), {
      method: 'DELETE',
    });
  }

  public async listProducts(): Promise<Product[]> {
    return this.request<Product[]>(API_ENDPOINTS.PRODUCTS.LIST, {
      method: 'GET',
    });
  }

  public async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    return this.request<Product>(API_ENDPOINTS.PRODUCTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async uploadProductImage(productId: string, formData: FormData): Promise<{ imageUrl: string }> {
    const url = API_ENDPOINTS.PRODUCTS.UPLOAD_IMAGE(productId);
    try {
      const response = await this.request(url, {
        method: 'POST',
        body: formData,
      });
      return response;
    } catch (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
  }

  public async deleteProductImage(productId: string): Promise<void> {
    return this.request<void>(API_ENDPOINTS.PRODUCTS.DELETE_IMAGE(productId), {
      method: 'DELETE',
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

// Export singleton instance
export const apiService = ApiService.getInstance();
