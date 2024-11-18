export const environment = {
  API_BASE_URL: 'https://gvuu1iidve.execute-api.ap-southeast-1.amazonaws.com',
  COGNITO: {
    USER_POOL_ID: 'ap-southeast-1_YkHJlmoyg',
    CLIENT_ID: '2pfmq0v0b7vfstt4hq4vm0klbr',
    REGION: 'ap-southeast-1',
    USER_GROUPS: {
      ADMIN: 'admin_group',
      MANAGE_PRODUCT: 'manage_product_group',
    },
  },
} as const;
