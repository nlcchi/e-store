"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Clear cart or any order-related temporary data here
    localStorage.removeItem('cart');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold tracking-tight">Order Placed Successfully!</h1>
          <p className="text-muted-foreground">
            Thank you for your purchase. We've received your order and will begin processing it right away.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="space-y-4">
            <h2 className="font-semibold">What's Next?</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• You'll receive an order confirmation email shortly</li>
              <li>• We'll notify you when your order ships</li>
              <li>• You can track your order status in your account</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col space-y-4 mt-8">
          <Button 
            onClick={() => router.push('/orders')}
            variant="outline"
            className="w-full"
          >
            View Order Status
          </Button>
          <Button 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
}