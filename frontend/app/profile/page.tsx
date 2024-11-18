'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Mail, Calendar, Package } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, username } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-medium">
                {username ? getInitials(username) : 'U'}
              </div>
              <div>
                <CardTitle className="text-2xl">{username}</CardTitle>
                <CardDescription>Member since January 2024</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Full Name</div>
                    <div className="text-sm text-muted-foreground">{username}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">user@example.com</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Member Since</div>
                    <div className="text-sm text-muted-foreground">January 2024</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Orders</div>
                    <div className="text-sm text-muted-foreground">0 orders placed</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button onClick={() => router.push('/profile/edit')}>
                  Edit Profile
                </Button>
                <Button onClick={() => router.push('/orders')} variant="outline">
                  View Orders
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
