export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: `/${API_VERSION}/register`,
    LOGIN: `/${API_VERSION}/login`,
    LOGOUT: `/${API_VERSION}/logout`,
    REFRESH: `/${API_VERSION}/refresh`,
    VERIFY: `/${API_VERSION}/verify`
  },
  PRODUCT: {
    CREATE: `/${API_VERSION}/product`,
    LIST: `/${API_VERSION}/products`,
    UPLOAD_IMAGE: (id: string) => `/${API_VERSION}/product/${id}/image`,
    DELETE_IMAGE: (id: string) => `/${API_VERSION}/product/${id}/image`
  },
  ORDER: {
    CREATE: `/${API_VERSION}/order/create`,
    LIST: `/${API_VERSION}/order`,
    PROCESS_INTENT: (intent: string) => `/${API_VERSION}/order/${intent}`
  },
  GENERAL: {
    COUNTRIES: `/${API_VERSION}/country`,
    CATEGORIES: `/${API_VERSION}/category`
  }
};
