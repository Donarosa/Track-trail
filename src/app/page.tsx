'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function HomePage() {
  const { session, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/login');
      return;
    }

    if (profile) {
      router.replace('/dashboard');
      return;
    }

    // Authenticated but no profile — user profile might not exist yet
    // Don't redirect to /login to avoid redirect loop
  }, [session, profile, loading, router]);

  // Authenticated but no profile in DB
  if (!loading && session && !profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-foreground/70">No se encontró tu perfil de usuario.</p>
          <p className="text-sm text-foreground/50">
            Verificá que el schema de Supabase esté ejecutado y que el trigger
            <code className="mx-1 bg-highlight/20 px-1.5 py-0.5 rounded">handle_new_user</code>
            haya creado tu registro en la tabla <code className="mx-1 bg-highlight/20 px-1.5 py-0.5 rounded">users</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
