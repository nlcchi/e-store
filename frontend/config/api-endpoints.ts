export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/login',
    LOGOUT: '/v1/logout',
    REGISTER: '/v1/register',
    REFRESH: '/v1/refresh',
    VERIFY: '/v1/verify',
    PROFILE: '/v1/profile'
  } as const,
  
  PRODUCTS: {
    LIST: '/v1/products',
    CREATE: '/v1/products',
    UPDATE: (id: string) => `/v1/products/${id}`,
    DELETE: (id: string) => `/v1/products/${id}`,
    DETAIL: (id: string) => `/v1/products/${id}`
  },
  
  ORDER: {
    CREATE: '/v1/order/create',
    LIST: '/v1/order',
    CART: '/v1/order/cart',
    PROCESS_INTENT: (intent: string) => `/v1/order/${intent}`
  },
  PAYMENT: {
    CHECKOUT: '/v1/payment/checkout'
  },
  GENERAL: {
    COUNTRIES: '/country',
    CATEGORIES: '/category'
  }
} as const;
