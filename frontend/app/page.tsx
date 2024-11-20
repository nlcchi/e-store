import { HeroSection } from '@/components/hero-section';
import { FeaturedCategories } from '@/components/featured-categories';
import ProductGrid from '@/components/product-grid';
import { environment } from '@/config/environment';

async function getInitialProducts() {
  try {
    const response = await fetch(`${environment.API_BASE_URL}/v1/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    const data = await response.json();
    return data.queryResult || [];
  } catch (error) {
    console.error('Error fetching initial products:', error);
    return [];
  }
}

export default async function Home() {
  const initialProducts = await getInitialProducts();

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <HeroSection />
      <FeaturedCategories />
      <ProductGrid initialProducts={initialProducts} />
    </div>
  );
}