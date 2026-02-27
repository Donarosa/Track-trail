'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import RunnerList from '@/components/trainer/RunnerList';
import Spinner from '@/components/ui/Spinner';
import type { User } from '@/types/database';

export default function RunnersPage() {
  const { profile } = useAuth();
  const [runners, setRunners] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchRunners = useCallback(async () => {
    if (!profile) return;

    // Todos los trainers/superadmin ven todos los runners
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'runner')
      .neq('status', 'deleted')
      .order('name');

    setRunners(data || []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    fetchRunners();
  }, [fetchRunners]);

  return (
    <AppShell requireRole={['trainer', 'superadmin']}>
      <h1 className="text-2xl font-bold text-foreground mb-6">Corredores</h1>

      {loading ? (
        <Spinner className="py-12" />
      ) : (
        <Card>
          <RunnerList runners={runners} onUpdate={fetchRunners} />
        </Card>
      )}
    </AppShell>
  );
}
