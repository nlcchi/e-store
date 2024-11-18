"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated) {
        setIsAuthorized(false);
        router.push("/login");
        return;
      }

      const hasAccess = authService.isAdmin() || authService.canManageProducts();
      setIsAuthorized(hasAccess);
      
      if (!hasAccess) {
        router.push("/");
      }
    };

    checkAuth();
  }, [router, isAuthenticated]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isAuthorized === false) {
    return null;
  }

  return <>{children}</>;
}