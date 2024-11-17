import { environment } from '@/config/environment';
import ProductGrid from '@/components/product-grid';
import { Product } from '@/types/product';

export const revalidate = 3600; // Revalidate every hour

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${environment.API_BASE_URL}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const products = await response.json();
    
    // Validate the response format
    if (!Array.isArray(products)) {
      console.error('Invalid products response format');
      return [];
    }

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function ProductsPage() {
  const initialProducts = await getProducts();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">All Products</h1>
      <ProductGrid initialProducts={initialProducts} />
    </div>
  );
}