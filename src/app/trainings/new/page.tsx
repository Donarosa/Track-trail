'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import TrainingForm from '@/components/trainer/TrainingForm';
import Card from '@/components/ui/Card';

const TRAINING_TYPES = [
  { id: 'pasadas', label: 'Pasadas', description: 'Series de repeticiones a ritmo intenso', icon: '⚡' },
  { id: 'cuestas', label: 'Cuestas', description: 'Trabajo en subidas con transiciones', icon: '⛰️' },
  { id: 'cambio_ritmo', label: 'Cambio de Ritmo', description: 'Alternar entre ritmos rápidos y lentos', icon: '🔄' },
  { id: 'fondo', label: 'Fondo', description: 'Carrera continua de larga distancia', icon: '🏃' },
  { id: 'libre', label: 'Libre', description: 'Personaliza tu entrenamiento desde cero', icon: '✏️' },
];

export default function NewTrainingPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  if (selectedType) {
    return (
      <AppShell requireRole={['trainer', 'superadmin']}>
        <TrainingForm
          trainingType={selectedType}
          trainingTypeLabel={TRAINING_TYPES.find((t) => t.id === selectedType)?.label}
          onExit={() => setSelectedType(null)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell requireRole={['trainer', 'superadmin']}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Nuevo Entrenamiento</h1>
        <button
          onClick={() => router.push('/trainings')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground/60 hover:text-foreground rounded-lg hover:bg-highlight/10 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Salir
        </button>
      </div>

      <p className="text-foreground/60 mb-6">Elegí el tipo de entrenamiento</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRAINING_TYPES.map((type) => (
          <button key={type.id} onClick={() => setSelectedType(type.id)} className="text-left">
            <Card className="h-full hover:shadow-md hover:border-secondary/50 transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{type.label}</h3>
                  <p className="text-sm text-foreground/60 mt-1">{type.description}</p>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
