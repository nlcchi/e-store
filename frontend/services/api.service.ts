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
  private static instance: ApiService;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const authService = AuthService.getInstance();
    const token = authService.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${environment.API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

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
    });
  }

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

  public async initiateCheckout(data: { 
    orders: Array<{ productId: string; count: number }>;
    location: { country: string; address: string };
  }): Promise<{ url: string }> {
    return this.request(API_ENDPOINTS.PAYMENT.CHECKOUT, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Add other API methods as needed
}

// Export singleton instance
export const apiService = ApiService.getInstance();
