export const environment = {
  API_BASE_URL: 'https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/',
  COGNITO: {
    USER_POOL_ID: 'ap-southeast-1_4kLtavAn2',
    CLIENT_ID: '3pjv7ovjv0rholpc1hpr0dn9tk',
    REGION: 'ap-southeast-1',
    USER_GROUPS: {
      ADMIN: 'admin_group',
      MANAGE_PRODUCT: 'manage_product_group',
    },
  },
} as const;
