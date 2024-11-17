"use client";

import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-lg">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070')",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="relative h-full flex flex-col justify-center items-start p-12 text-white">
        <h1 className="text-5xl font-bold mb-4">Shop the Future</h1>
        <p className="text-xl mb-8 max-w-lg">
          Discover our curated collection of premium products across multiple categories.
          Quality meets convenience in every purchase.
        </p>
        <Button size="lg" className="bg-white text-black hover:bg-gray-100">
          <ShoppingBag className="mr-2 h-5 w-5" />
          Shop Now
        </Button>
      </div>
    </div>
  );
}