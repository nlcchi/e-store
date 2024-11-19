import { notFound } from "next/navigation";
import ProductGrid from "@/components/product-grid";
import { Product } from '@/types/product';

const categories = [
  "Grocery",
  "Electronics",
  "Health & Beauty",
  "Automobile",
  "Home & Kitchen",
  "Phones & Tablets",
  "Books",
  "Gaming",
  "Fashion",
  "Sports & Outdoors",
];

export function generateStaticParams() {
  return categories.map((slug) => ({
    slug: slug.toLowerCase().replace(/ & /g, '-'),
  }));
}

async function getCategoryProducts(category: string): Promise<Product[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` 
      : '';
    
    const formattedCategory = category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" & ")
      .replace('And', '&');

    const url = new URL(`${baseUrl}/api/products`);
    url.searchParams.append('category', formattedCategory);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch category products: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching category products:', error);
    return [];
  }
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const categorySlug = params.slug.toLowerCase();
  const matchedCategory = categories.find(
    cat => cat.toLowerCase().replace(/ & /g, '-') === categorySlug
  );

  if (!matchedCategory) {
    notFound();
  }

  const products = await getCategoryProducts(categorySlug);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">{matchedCategory}</h1>
      <ProductGrid initialProducts={products} />
    </div>
  );
}