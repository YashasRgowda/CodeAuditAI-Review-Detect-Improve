// File: src/components/layout/Header.js - UPDATE THIS FILE
'use client';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function Header() {
  const { user, isAuthenticated } = useAuth();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth' });
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-black">
              AI Code Review
            </Link>
          </div>
          
          {isAuthenticated && (
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-black">
                Dashboard
              </Link>
              <Link href="/repositories" className="text-gray-600 hover:text-black">
                Repositories
              </Link>
              <Link href="/analysis" className="text-gray-600 hover:text-black">
                Analysis
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {user?.image && (
                  <img 
                    src={user.image} 
                    alt={user.name} 
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-600">
                  {user?.name || user?.email}
                </span>
                <Button variant="secondary" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}