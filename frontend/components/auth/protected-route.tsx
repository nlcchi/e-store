'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowGuest?: boolean;
}

export function ProtectedRoute({ children, allowGuest = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isGuest && !allowGuest) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, isGuest, allowGuest, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !isGuest && !allowGuest) {
    return null;
  }

  return <>{children}</>;
}
