"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { NavigationMenu } from "@/components/ui/navigation-menu";
import {
  ShoppingCart,
  User,
  Search,
  Sun,
  Moon,
  Menu,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CartSheet } from "@/components/cart-sheet";
import { useAuth } from "@/lib/auth-context";
import { AuthService } from "@/services/auth.service";

export default function Navbar() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, username, logout } = useAuth();
  const authService = AuthService.getInstance();

  const hasAdminAccess = isAuthenticated && (authService.isAdmin() || authService.canManageProducts());

  // Debug information
  console.log('Auth Debug:', {
    isAuthenticated,
    username,
    userGroups: authService.getUserGroup(),
    hasAdminAccess,
    isAdmin: authService.isAdmin(),
    canManageProducts: authService.canManageProducts()
  });

  const handleUserClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingCart className="h-6 w-6" />
            <span className="text-xl font-bold">Cara</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          <NavigationMenu className="hidden md:flex">
            <Link href="/products" className="text-sm font-medium">
              All Products
            </Link>
            <Link href="/deals" className="text-sm font-medium ml-4">
              Deals
            </Link>
            <Link href="/new" className="text-sm font-medium ml-4">
              New Arrivals
            </Link>
          </NavigationMenu>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {theme === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {username ? getInitials(username) : 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/orders')}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </DropdownMenuItem>
                {hasAdminAccess && (
                  <DropdownMenuItem onClick={() => router.push('/admin')}>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Admin Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleUserClick}>
              <User className="h-5 w-5" />
            </Button>
          )}
          
          <CartSheet />
        </div>
      </nav>
    </header>
  );
}