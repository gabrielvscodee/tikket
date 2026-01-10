'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getToken } from '@/lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  // Check token synchronously on first render (client-side only since this is 'use client')
  const [hasToken] = useState(() => !!getToken());

  useEffect(() => {
    // Re-check token to catch removal
    const token = getToken();
    
    // If no token, redirect immediately
    if (!token) {
      router.replace('/login');
      return;
    }

    // If auth context finished loading and no user, redirect
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  // If no token, don't render anything (redirecting)
  if (!hasToken) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Block rendering until we confirm authentication
  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If no user after loading completes, block rendering
  // (redirect will happen in useEffect)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Only render children if we have a confirmed user
  return <>{children}</>;
}

