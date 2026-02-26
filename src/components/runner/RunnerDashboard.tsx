'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import RankingTable from '@/components/runner/RankingTable';
import PersonalStats from '@/components/runner/PersonalStats';
import TrainingCard from '@/components/runner/TrainingCard';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import type { AssignmentWithTraining } from '@/types/database';

interface KmRanking {
  runner_id: string;
  runner_name: string;
  total_km: number;
}

interface TrainingRanking {
  runner_id: string;
  runner_name: string;
  completed_count: number;
}

export default function RunnerDashboard() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<AssignmentWithTraining[]>([]);
  const [kmTop5, setKmTop5] = useState<KmRanking[]>([]);
  const [trainingTop5, setTrainingTop5] = useState<TrainingRanking[]>([]);
  const [personalKm, setPersonalKm] = useState(0);
  const [personalCompleted, setPersonalCompleted] = useState(0);

  useEffect(() => {
    if (!profile) return;

    const fetchAll = async () => {
      // Fetch recent assignments with training data
      const { data: assignData } = await supabase
        .from('runner_assignments')
        .select(`
          *,
          training:trainings(*, training_blocks(*))
        `)
        .eq('runner_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setAssignments((assignData as unknown as AssignmentWithTraining[]) || []);

      // Fetch rankings via RPC (using trainer_id from profile)
      if (profile.trainer_id) {
        const [{ data: kmData }, { data: trainData }] = await Promise.all([
          supabase.rpc('get_monthly_km_top5', { p_trainer_id: profile.trainer_id }),
          supabase.rpc('get_monthly_training_top5', { p_trainer_id: profile.trainer_id }),
        ]);

        setKmTop5((kmData as KmRanking[]) || []);
        setTrainingTop5((trainData as TrainingRanking[]) || []);
      }

      // Personal stats this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: personalResults } = await supabase
        .from('runner_results')
        .select('value_distance, assignment_id, runner_assignments!inner(runner_id)')
        .eq('runner_assignments.runner_id', profile.id)
        .gte('created_at', startOfMonth.toISOString());

      const totalKm = (personalResults || []).reduce(
        (sum, r) => sum + (Number(r.value_distance) || 0),
        0
      );
      setPersonalKm(totalKm);

      const { count } = await supabase
        .from('runner_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('runner_id', profile.id)
        .eq('status', 'completed')
        .gte('created_at', startOfMonth.toISOString());

      setPersonalCompleted(count ?? 0);

      setLoading(false);
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  if (loading) return <Spinner className="py-12" />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Mobile: personal stats on top */}
      <div className="md:hidden mb-4">
        <PersonalStats kmMonth={personalKm} completedMonth={personalCompleted} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left column: Rankings */}
        <div className="md:col-span-3 space-y-4">
          <RankingTable
            title="Top 5 Km del Mes"
            data={kmTop5}
            valueKey="total_km"
            unit="km"
          />
          <RankingTable
            title="Top 5 Entrenamientos"
            data={trainingTop5}
            valueKey="completed_count"
            unit=""
          />
        </div>

        {/* Center: Feed */}
        <div className="md:col-span-6 space-y-3">
          <h2 className="text-sm font-semibold text-foreground/70">Últimas Actividades</h2>
          {assignments.length === 0 ? (
            <Card>
              <p className="text-center text-foreground/50 py-6">
                No tienes entrenamientos asignados.
              </p>
            </Card>
          ) : (
            assignments.map((a) => (
              <TrainingCard key={a.id} assignment={a} />
            ))
          )}
        </div>

        {/* Right column: Personal stats (desktop only) */}
        <div className="hidden md:block md:col-span-3">
          <PersonalStats kmMonth={personalKm} completedMonth={personalCompleted} />
        </div>
      </div>
    </div>
  );
}
