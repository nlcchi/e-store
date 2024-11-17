"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { dispatch } = useCart();

  useEffect(() => {
    dispatch({ type: "CLEAR_CART" });
  }, [dispatch]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center space-y-6">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <p className="text-muted-foreground">
          Thank you for your purchase. We'll send you a confirmation email with your order details.
        </p>
        <Button onClick={() => router.push("/")} className="w-full">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}