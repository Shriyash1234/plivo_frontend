'use client';

import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider } from '../providers/auth-provider';

export default function Providers({ children }) {
  useEffect(() => {
    document.body.classList.add('bg-background');
  }, []);

  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}
