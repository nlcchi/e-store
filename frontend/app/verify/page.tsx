'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const verifySchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits')
    .regex(/^\d+$/, 'Verification code must contain only numbers'),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyPage() {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();
  const username = searchParams.get('username');

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: '',
    },
  });

  const onSubmit = async (data: VerifyFormData) => {
    if (!username) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Check if we have temporary tokens
      const tempAccessToken = localStorage.getItem('TempAccessToken');
      const tempIdToken = localStorage.getItem('TempIdToken');
      
      if (!tempAccessToken || !tempIdToken) {
        throw new Error('Registration session expired. Please register again.');
      }
      
      await verifyEmail(username, data.code);
      
    } catch (error) {
      console.error('Verification error:', error);
      if (error instanceof Error) {
        form.setError('code', { message: error.message });
      } else {
        form.setError('code', { message: 'Verification failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!username) {
      return;
    }

    try {
      setIsResending(true);
      await resendVerificationCode(username);
      form.reset(); // Clear the code input
      form.setFocus('code'); // Focus the code input
    } catch (error) {
      console.error('Resend code error:', error);
      if (error instanceof Error) {
        form.setError('code', { message: error.message });
      } else {
        form.setError('code', { message: 'Failed to resend code. Please try again.' });
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!username) {
    return (
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          <Link href="/" className="relative z-20 flex items-center text-lg font-medium">
            <span className="hidden font-bold sm:inline-block">Cara</span>
          </Link>
        </div>
        <div className="p-4 lg:p-8 h-full flex items-center">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Invalid Request</CardTitle>
              <CardDescription>
                No username provided. Please try registering again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/register">Go to Register</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <Link href="/" className="relative z-20 flex items-center text-lg font-medium">
          <span className="hidden font-bold sm:inline-block">Cara</span>
        </Link>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Please check your email for the verification code. It may take a few minutes to arrive.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Verify your email</CardTitle>
            <CardDescription>
              Enter the verification code sent to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit code"
                          maxLength={6}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify Email'}
                </Button>
              </form>
            </Form>
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'Resend Code'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Wrong email?{' '}
              <Link href="/register" className="text-primary hover:underline">
                Register again
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
