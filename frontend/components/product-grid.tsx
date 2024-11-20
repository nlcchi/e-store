'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Product, ProductFilters, ProductResponse } from '../types/product';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/components/ui/use-toast";
import { environment } from '@/config/environment';

const getImageUrl = (productId: string) => {
  return `https://bucket-product-images-1731911956256.s3.ap-southeast-1.amazonaws.com/${productId}/1.jpg`;
};

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
      if (initialProducts.length > 0) {
        setProducts(initialProducts);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`${environment.API_BASE_URL}/v1/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(filters),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: ProductResponse = await response.json();
        
        if (data.queryResult && Array.isArray(data.queryResult)) {
          setProducts(data.queryResult);
          setLastKey(data.lastKey?.id.S || null);
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
  }, [filters, initialProducts]);

  const addToCart = (product: Product) => {
    dispatch({
      type: "ADD_ITEM",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: getImageUrl(product.id),
      },
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div className="p-0">
            <div className="relative aspect-square">
              <Image
                src={getImageUrl(product.id)}
                alt={product.name}
                fill
                priority
                unoptimized
                className="object-cover rounded-t-lg"
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
          </div>
          <div className="flex items-center p-4">
            <Button
              className="w-full"
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}