'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/hooks/redux';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="center-screen" role="status" aria-live="polite">
        <div className="spinner" />
        <p>Loading session…</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
