'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';

interface Stats {
  totalRunners: number;
  activeTrainings: number;
  completedThisMonth: number;
}

export default function TrainerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalRunners: 0, activeTrainings: 0, completedThisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      const trainerId = profile.id;

      const [runnersRes, trainingsRes, completedRes] = await Promise.all([
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('trainer_id', trainerId)
          .eq('role', 'runner')
          .eq('status', 'active'),
        supabase
          .from('trainings')
          .select('id', { count: 'exact', head: true })
          .eq('trainer_id', trainerId)
          .eq('status', 'published'),
        supabase
          .from('runner_assignments')
          .select('id, trainings!inner(trainer_id)', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('trainings.trainer_id', trainerId),
      ]);

      setStats({
        totalRunners: runnersRes.count ?? 0,
        activeTrainings: trainingsRes.count ?? 0,
        completedThisMonth: completedRes.count ?? 0,
      });
      setLoading(false);
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (loading) return <Spinner className="py-12" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <p className="text-sm text-foreground/60">Corredores Activos</p>
          <p className="text-3xl font-bold text-primary mt-1">{stats.totalRunners}</p>
        </Card>
        <Card>
          <p className="text-sm text-foreground/60">Entrenamientos Publicados</p>
          <p className="text-3xl font-bold text-secondary mt-1">{stats.activeTrainings}</p>
        </Card>
        <Card>
          <p className="text-sm text-foreground/60">Completados (mes)</p>
          <p className="text-3xl font-bold text-accent mt-1">{stats.completedThisMonth}</p>
        </Card>
      </div>
    </div>
  );
}
