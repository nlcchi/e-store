import ProductGrid from "@/components/product-grid";
import { Product } from '@/types/product';

async function getNewArrivals(): Promise<Product[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_VERCEL_URL || ''}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sortBy: 'created',
        sortOrder: 'desc',
        limit: 20
      }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch new arrivals: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.queryResult || !Array.isArray(data.queryResult)) {
      console.error('Invalid products response format');
      return [];
    }

    return data.queryResult;
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

export default async function NewArrivalsPage() {
  const products = await getNewArrivals();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">New Arrivals</h1>
      <ProductGrid initialProducts={products} />
    </div>
  );
}