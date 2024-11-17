'use client';

import { environment } from '../config/environment';
import { API_ENDPOINTS } from '../config/api-endpoints';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

export class ApiService {
  private static instance: ApiService | null = null;
  private readonly baseUrl: string;

  private constructor() {
    this.baseUrl = environment.API_BASE_URL;
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

    if (requiresAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...fetchOptions,
      headers
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async getAuthToken(): Promise<string | null> {
    // Get token from localStorage or other storage mechanism
    return localStorage.getItem('accessToken');
  }

  // Auth endpoints
  public async register(data: any) {
    return this.request(API_ENDPOINTS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async login(credentials: LoginCredentials): Promise<AuthTokens> {
    return this.request<AuthTokens>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  public async logout() {
    return this.request(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
      requiresAuth: true
    });
  }

  public async refreshToken(refreshToken: string): Promise<AuthTokens> {
    return this.request<AuthTokens>(API_ENDPOINTS.AUTH.REFRESH, {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      requiresAuth: false
    });
  }

  // Product endpoints
  public async createProduct(data: any) {
    return this.request(API_ENDPOINTS.PRODUCT.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: true
    });
  }

  public async getProducts(filters?: any) {
    return this.request(API_ENDPOINTS.PRODUCT.LIST, {
      method: 'POST',
      body: JSON.stringify(filters)
    });
  }

  public async uploadProductImage(productId: string, imageFile: File) {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.request(API_ENDPOINTS.PRODUCT.UPLOAD_IMAGE(productId), {
      method: 'POST',
      body: formData,
      requiresAuth: true
    });
  }

  // Order endpoints
  public async createOrder(orderData: any) {
    return this.request(API_ENDPOINTS.ORDER.CREATE, {
      method: 'POST',
      body: JSON.stringify(orderData),
      requiresAuth: true
    });
  }

  public async getOrders(filters?: any) {
    return this.request(API_ENDPOINTS.ORDER.LIST, {
      method: 'POST',
      body: JSON.stringify(filters),
      requiresAuth: true
    });
  }

  // General endpoints
  public async getCountries() {
    return this.request(API_ENDPOINTS.GENERAL.COUNTRIES, {
      method: 'GET'
    });
  }

  public async getCategories() {
    return this.request(API_ENDPOINTS.GENERAL.CATEGORIES, {
      method: 'GET'
    });
  }
}
