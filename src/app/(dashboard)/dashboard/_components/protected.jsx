'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../../../providers/auth-provider';

export function Protected({ children }) {
  const router = useRouter();
  const { loading, user, token } = useAuth();

  useEffect(() => {
    if (!loading && (!token || !user)) {
      router.replace('/login');
    }
  }, [loading, token, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading workspace...</div>
      </div>
    );
  }

  return children;
}
