import { HeroSection } from '@/components/hero-section';
import { FeaturedCategories } from '@/components/featured-categories';
import ProductGrid from '@/components/product-grid';
import { environment } from '@/config/environment';

async function getInitialProducts() {
  try {
    const response = await fetch(`${environment.API_BASE_URL}/products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }

    return response.json();
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