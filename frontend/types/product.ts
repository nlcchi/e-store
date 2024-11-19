export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  image_1?: boolean | null;
  image_2?: boolean | null;
  image_3?: boolean | null;
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
