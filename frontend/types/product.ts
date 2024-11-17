export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  created: string;
  image_1?: boolean;
  image_2?: boolean;
  image_3?: boolean;
}

export interface ProductResponse {
  queryResult: Product[];
  lastKey?: {
    id: {
      S: string;
    };
  };
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'created' | 'price' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
