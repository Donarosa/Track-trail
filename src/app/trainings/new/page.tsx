'use client';

import AppShell from '@/components/layout/AppShell';
import TrainingForm from '@/components/trainer/TrainingForm';

export default function NewTrainingPage() {
  return (
    <AppShell requireRole={['trainer', 'superadmin']}>
      <h1 className="text-2xl font-bold text-foreground mb-6">Nuevo Entrenamiento</h1>
      <TrainingForm />
    </AppShell>
  );
}
