'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { User } from '@/types/database';

interface RunnerListProps {
  runners: User[];
  onUpdate: () => void;
}

export default function RunnerList({ runners, onUpdate }: RunnerListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();

  const toggleStatus = async (runner: User) => {
    setActionLoading(runner.id);
    const newStatus = runner.status === 'active' ? 'paused' : 'active';

    await supabase
      .from('users')
      .update({ status: newStatus })
      .eq('id', runner.id);

    setActionLoading(null);
    onUpdate();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Activo</Badge>;
      case 'paused':
        return <Badge variant="warning">Pausado</Badge>;
      default:
        return <Badge variant="danger">Eliminado</Badge>;
    }
  };

  if (runners.length === 0) {
    return (
      <p className="text-center text-foreground/60 py-8">
        No hay corredores asignados todavía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-highlight/30">
            <th className="text-left py-3 px-2 font-medium text-foreground/60">Nombre</th>
            <th className="text-left py-3 px-2 font-medium text-foreground/60">Email</th>
            <th className="text-left py-3 px-2 font-medium text-foreground/60">Estado</th>
            <th className="text-right py-3 px-2 font-medium text-foreground/60">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {runners.map((runner) => (
            <tr key={runner.id} className="border-b border-highlight/20">
              <td className="py-3 px-2 font-medium">{runner.name || '—'}</td>
              <td className="py-3 px-2 text-foreground/70">{runner.email}</td>
              <td className="py-3 px-2">{statusBadge(runner.status)}</td>
              <td className="py-3 px-2 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  loading={actionLoading === runner.id}
                  onClick={() => toggleStatus(runner)}
                >
                  {runner.status === 'active' ? 'Pausar' : 'Activar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
