'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Product, ProductFilters, ProductResponse } from '../types/product';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/use-toast";

interface ProductGridProps {
  initialProducts?: Product[];
  filters?: ProductFilters;
}

export default function ProductGrid({ initialProducts = [], filters }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(!initialProducts.length);
  const [error, setError] = useState<string | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);

  const { dispatch } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      // Don't fetch if we already have initial products
      if (initialProducts.length > 0) return;
      
      try {
        setLoading(true);
        const url = new URL('/api/products', window.location.origin);
        
        // Add filters as query parameters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value.toString());
          });
        }

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (Array.isArray(data)) {
          setProducts(data);
          setError(null);
        } else if (data.queryResult && Array.isArray(data.queryResult)) {
          setProducts(data.queryResult);
          setLastKey(data.lastKey?.id?.S || null);
          setError(null);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError('Failed to fetch products. Please try again later.');
        console.error('Error fetching products:', err);
        setProducts([]); // Reset products on error
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, initialProducts.length]);

  const addToCart = (product: Product) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_1 ? `/images/products/${product.id}_1.jpg` : '/images/placeholder.jpg',
      },
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg" />
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">{error}</p>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No products found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="flex flex-col">
          <div className="relative h-48 bg-gray-100 rounded-t-lg">
            {product.image_1 ? (
              <Image
                src={product.image_1 ? `/images/products/${product.id}_1.jpg` : '/images/placeholder.jpg'}
                alt={product.name}
                fill
                className="object-cover rounded-t-lg"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>
          <CardContent className="flex-grow p-4">
            <h3 className="font-semibold mb-2">{product.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{product.description}</p>
            <p className="text-lg font-bold">${product.price.toFixed(2)}</p>
            <p className="text-sm text-gray-500">Stock: {product.stock}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              className="w-full"
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
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