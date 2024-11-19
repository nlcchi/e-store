'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Product, ProductFilters, ProductResponse } from '../types/product';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { apiService } from '@/services/api.service';

interface ProductGridProps {
  initialProducts?: Product[];
  filters?: ProductFilters;
}

export default function ProductGrid({ initialProducts = [], filters }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { dispatch } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching products...');
        const data = await apiService.listProducts();
        console.log('Products response:', data);

        if (data && 'queryResult' in data) {
          const response = data as ProductResponse;
          setProducts(response.queryResult);
          setLastKey(response.lastKey?.id?.S || null);
        } else {
          console.error('Invalid data format:', data);
          throw new Error('Invalid data format received from server');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch products');
        setProducts([]); // Reset products on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, initialProducts.length]);

  const handleAddToCart = (product: Product) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_1 ? `/images/products/${product.id}_1.jpg` : product.imageUrl || '/images/placeholder.jpg',
      },
    });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  if (!products.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative h-48 w-full">
              <Image
                src={product.image_1 ? `/images/products/${product.id}_1.jpg` : product.imageUrl || '/images/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                <span className="text-sm text-gray-500">Stock: {product.stock}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4">
            <Button 
              className="w-full" 
              onClick={() => handleAddToCart(product)}
              disabled={product.stock <= 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}