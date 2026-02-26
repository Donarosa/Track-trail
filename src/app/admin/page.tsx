'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/layout/AppShell';
import TrainerManager from '@/components/admin/TrainerManager';
import Spinner from '@/components/ui/Spinner';
import type { AuthorizedTrainer } from '@/types/database';

export default function AdminPage() {
  const [trainers, setTrainers] = useState<AuthorizedTrainer[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchTrainers = useCallback(async () => {
    const { data } = await supabase
      .from('authorized_trainers')
      .select('*')
      .order('created_at', { ascending: false });

    setTrainers(data || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  return (
    <AppShell requireRole={['superadmin']}>
      <h1 className="text-2xl font-bold text-foreground mb-6">Administración</h1>

      {loading ? (
        <Spinner className="py-12" />
      ) : (
        <TrainerManager trainers={trainers} onUpdate={fetchTrainers} />
      )}
    </AppShell>
  );
}
