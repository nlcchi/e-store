export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/login',
    LOGOUT: '/logout',
    REGISTER: '/register',
    REFRESH: '/refresh',
  },
  PRODUCTS: {
    CREATE: '/product',
    LIST: '/products',
    DETAIL: '/product',
  },
  ORDER: {
    CREATE: '/order/create',
    LIST: '/order',
    CART: '/order/cart',
    PROCESS_INTENT: (intent: string) => `/order/${intent}`
  },
  PAYMENT: {
    CHECKOUT: '/payment/checkout'
  },
  GENERAL: {
    COUNTRIES: '/country',
    CATEGORIES: '/category'
  }
} as const;
