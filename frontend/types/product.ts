export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface ProductResponse {
  queryResult: Product[];
  lastKey?: {
    id: {
      S: string;
    };
  };
}
