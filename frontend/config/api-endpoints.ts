export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/login',
    REGISTER: '/v1/register',
    LOGOUT: '/v1/logout',
    REFRESH: '/v1/refresh',
    PROFILE: '/v1/profile',
    VERIFY: '/v1/verify',
  } as const,
  
  PRODUCTS: {
    LIST: '/v1/products',
    CREATE: '/v1/products',
    DETAIL: (id: string) => `/v1/products/${id}`,
    UPDATE: (id: string) => `/v1/products/${id}`,
    DELETE: (id: string) => `/v1/products/${id}`,
    UPLOAD_IMAGE: (id: string) => `/v1/products/${id}/image`,
    DELETE_IMAGE: (id: string) => `/v1/products/${id}/image`,
  } as const,
  
  PAYMENT: {
    CHECKOUT: '/v1/payment/checkout',
  } as const,
} as const;
