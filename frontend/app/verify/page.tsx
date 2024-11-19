'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyPage() {
  const { verifyEmail, resendVerificationCode } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const searchParams = useSearchParams();
  const username = searchParams.get('username');
  const [code, setCode] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
      toast.error('Username not found. Please register again.');
      return;
    }
    if (!code) {
      toast.error('Please enter the verification code.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmail(username, code);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!username) {
      toast.error('Username not found. Please register again.');
      return;
    }

    setIsResending(true);
    try {
      await resendVerificationCode(username);
    } catch (error) {
      console.error('Failed to resend code:', error);
    } finally {
      setIsResending(false);
    }
  };

  if (!username) {
    return (
      <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Invalid Request</h1>
            <p className="text-sm text-muted-foreground">
              No username found. Please register again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Verify Your Email</h1>
          <p className="text-sm text-muted-foreground">
            Please enter the verification code sent to your email.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Code
          </Button>
        </form>
      </div>
    </div>
  );
}
