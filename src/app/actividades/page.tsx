'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/layout/AppShell';
import TrainingCard from '@/components/runner/TrainingCard';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import type { AssignmentWithTraining } from '@/types/database';

export default function ActividadesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithTraining[]>([]);

  useEffect(() => {
    if (!profile) return;

    const fetchAssignments = async () => {
      const { data } = await supabase
        .from('runner_assignments')
        .select(`
          *,
          training:trainings(*, training_blocks(*))
        `)
        .eq('runner_id', profile.id)
        .order('created_at', { ascending: false });

      setAssignments((data as unknown as AssignmentWithTraining[]) || []);
      setLoading(false);
    };

    fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  return (
    <AppShell requireRole={['runner']}>
      <h1 className="text-2xl font-bold text-foreground mb-6">Mis Actividades</h1>

      {loading ? (
        <Spinner className="py-12" />
      ) : assignments.length === 0 ? (
        <Card>
          <p className="text-center text-foreground/50 py-6">
            No tienes entrenamientos asignados.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <TrainingCard key={a.id} assignment={a} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
