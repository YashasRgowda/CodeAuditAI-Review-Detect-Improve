// File: src/app/auth/callback/page.js - REPLACE ENTIRE FILE
'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '@/lib/auth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        router.push('/auth?error=no_code');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        });

        const data = await response.json();
        console.log('Callback response:', data); // Debug log
        
        if (data.access_token) {
          setToken(data.access_token);
          // Force page reload to update auth state
          window.location.href = '/';
        } else {
          console.error('No access token in response:', data);
          router.push('/auth?error=token_failed');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.push('/auth?error=callback_failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}