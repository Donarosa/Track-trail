'use client';

import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import Spinner from '@/components/ui/Spinner';

interface AppShellProps {
  children: React.ReactNode;
  requireRole?: ('superadmin' | 'trainer' | 'runner')[];
}

export default function AppShell({ children, requireRole }: AppShellProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profile) return null;

  if (requireRole && !requireRole.includes(profile.role)) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-foreground/60">No tienes acceso a esta página.</p>
      </div>
    );
  }

  const showSidebar = profile.role === 'trainer' || profile.role === 'superadmin' || profile.role === 'runner';

  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className="flex-1 max-w-6xl mx-auto px-4 py-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
