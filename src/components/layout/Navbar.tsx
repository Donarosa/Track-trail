'use client';

import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function Navbar() {
  const { profile, signOut } = useAuth();

  const roleBadgeVariant = {
    superadmin: 'info' as const,
    trainer: 'info' as const,
    runner: 'success' as const,
  };

  const roleLabel = {
    superadmin: 'Entrenador',
    trainer: 'Entrenador',
    runner: 'Corredor',
  };

  return (
    <header className="bg-primary text-tt-white">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold tracking-tight">TrackTrail</h1>
          {profile && (
            <Badge variant={roleBadgeVariant[profile.role]}>
              {roleLabel[profile.role]}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-sm text-tt-white/70 hidden sm:block">
              {profile.name || profile.email}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={signOut} className="text-tt-white hover:bg-tt-white/10">
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}
