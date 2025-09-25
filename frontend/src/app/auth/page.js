// File: src/app/auth/page.js - REPLACE ENTIRE FILE
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function AuthPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSignIn = () => {
    signIn('github', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">AI Code Review Assistant</h1>
          <p className="text-gray-600 mb-6">Sign in with GitHub to get started</p>
          <Button onClick={handleSignIn} className="w-full">
            Sign in with GitHub
          </Button>
        </div>
      </Card>
    </div>
  );
}