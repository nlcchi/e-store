# E-Store Project Summary

## Backend API Endpoints
Base URL: `https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com`

### Authentication Endpoints
```
POST /v1/register    - Register new user
POST /v1/login       - Login user
POST /v1/logout      - Logout user
POST /v1/refresh     - Refresh authentication tokens
POST /v1/verify      - Verify authentication (requires auth)
```

### Product Management
```
POST /v1/product              - Create product (requires auth)
POST /v1/products            - Get products
POST /v1/product/{id}/image  - Upload product image (requires auth)
DELETE /v1/product/{id}/image - Delete product image (requires auth)
```

### Order Management
```
POST /v1/order/create    - Create new order (requires auth)
POST /v1/order          - Get orders (requires auth)
POST /v1/order/{intent} - Process order intent (requires auth)
```

### General Endpoints
```
GET /v1/country   - Get supported countries
GET /v1/category  - Get product categories
```

### Authentication Details
- User Pool ID: `ap-southeast-1_4kLtavAn2`
- Client ID: `3pjv7ovjv0rholpc1hpr0dn9tk`
- User Groups:
  - `admin_group`
  - `manage_product_group`

## Frontend Development Guide

### 1. Setup New Frontend Project
```bash
# Using Next.js (recommended)
npx create-next-app@latest e-store-frontend --typescript

# OR Using Create React App
npx create-react-app e-store-frontend --template typescript
```

### 2. Required Dependencies
```json
{
  "dependencies": {
    "@aws-amplify/auth": "^5.0.0",        // AWS Cognito authentication
    "axios": "^1.6.0",                    // API requests
    "react-query": "^3.39.0",             // Data fetching/caching
    "tailwindcss": "^3.3.0",              // Styling (optional)
    "react-hook-form": "^7.43.0",         // Form handling
    "zod": "^3.22.0"                      // Data validation
  }
}
```

### 3. Key Features to Implement

#### Authentication
- User registration and login forms
- Token management (store in HTTP-only cookies)
- Protected routes for authenticated users
- Role-based access control (admin vs regular users)

#### Product Management
- Product listing page with filters
- Product detail page
- Product image upload (for admins)
- Shopping cart functionality
- Category-based browsing

#### Order Management
- Shopping cart to order conversion
- Order history
- Order status tracking

#### Admin Dashboard
- Product management (CRUD operations)
- Order management
- User management

### 4. Frontend Architecture

```typescript
// src/types/api.ts
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image_1?: string;
  image_2?: string;
  image_3?: string;
}

interface Order {
  id: string;
  user: string;
  intent: string;
  status: string;
  products: Product[];
}
```

### 5. API Integration

```typescript
// src/api/client.ts
import axios from 'axios';

const API_BASE_URL = 'https://144k9r6646.execute-api.ap-southeast-1.amazonaws.com/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

// Add authentication interceptor
apiClient.interceptors.request.use((config) => {
  // Add auth tokens from storage/context
  return config;
});
```

### 6. Deployment Options
1. AWS Amplify Hosting (recommended)
2. Vercel
3. Netlify
4. AWS S3 + CloudFront

### 7. Development Best Practices
1. Use TypeScript for type safety
2. Implement proper error handling
3. Add loading states for API calls
4. Use environment variables for API endpoints
5. Implement proper form validation
6. Add proper SEO meta tags
7. Ensure mobile responsiveness
8. Implement proper testing (Jest + React Testing Library)

### 8. Security Considerations
1. Store tokens securely (HTTP-only cookies)
2. Implement CSRF protection
3. Sanitize user inputs
4. Use HTTPS only
5. Implement rate limiting
6. Add proper error boundaries
7. Never expose sensitive data in client-side code

### 9. Supported Categories
```typescript
const CATEGORIES = [
  'Grocery',
  'Electronics',
  'Health & Beauty',
  'Automobile',
  'Home & Kitchen',
  'Phones & Tablets',
  'Books',
  'Gaming',
  'Fashion',
  'Sports & Outdoors'
];
```

### 10. Next Steps
1. Set up the frontend project structure
2. Implement authentication flow
3. Create basic product listing and detail pages
4. Add shopping cart functionality
5. Implement checkout process
6. Add admin dashboard
7. Add tests and documentation
8. Deploy to production
