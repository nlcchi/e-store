'use client';

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  Tv,
  ShoppingCart,
  Car,
  Home,
  Heart,
  BookOpen,
  Gamepad2,
  Shirt,
  Trophy,
} from "lucide-react";

const categories = [
  { name: "Grocery", icon: ShoppingCart, href: "/category/grocery" },
  { name: "Electronics", icon: Tv, href: "/category/electronics" },
  { name: "Health & Beauty", icon: Heart, href: "/category/health-beauty" },
  { name: "Automobile", icon: Car, href: "/category/automobile" },
  { name: "Home & Kitchen", icon: Home, href: "/category/home-kitchen" },
  { name: "Books", icon: BookOpen, href: "/category/books" },
  { name: "Gaming", icon: Gamepad2, href: "/category/gaming" },
  { name: "Fashion", icon: Shirt, href: "/category/fashion" },
  { name: "Sports", icon: Trophy, href: "/category/sports" },
];

export function FeaturedCategories() {
  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.name} href={category.href}>
              <Card className="hover:bg-accent transition-colors">
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-2">
                  <Icon className="h-8 w-8" />
                  <span className="font-medium text-sm">{category.name}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}