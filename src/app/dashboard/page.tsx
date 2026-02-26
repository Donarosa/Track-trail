'use client';

import { useAuth } from '@/contexts/AuthContext';
import AppShell from '@/components/layout/AppShell';
import TrainerDashboard from '@/components/trainer/TrainerDashboard';
import RunnerDashboard from '@/components/runner/RunnerDashboard';

export default function DashboardPage() {
  const { profile } = useAuth();

  const isTrainerOrAdmin = profile?.role === 'trainer' || profile?.role === 'superadmin';

  return (
    <AppShell>
      {isTrainerOrAdmin ? <TrainerDashboard /> : <RunnerDashboard />}
    </AppShell>
  );
}
