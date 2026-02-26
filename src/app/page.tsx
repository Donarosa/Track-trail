'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function HomePage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!profile) {
      router.replace('/login');
      return;
    }

    router.replace('/dashboard');
  }, [profile, loading, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
