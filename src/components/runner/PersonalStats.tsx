'use client';

import Card from '@/components/ui/Card';

interface PersonalStatsProps {
  kmTotal: number;
  completedTotal: number;
  kmMonth: number;
  completedMonth: number;
}

export default function PersonalStats({ kmTotal, completedTotal, kmMonth, completedMonth }: PersonalStatsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-sm font-semibold text-foreground/70 mb-3">Total Histórico</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Km recorridos</span>
            <span className="text-lg font-bold text-primary">{kmTotal.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Entrenamientos</span>
            <span className="text-lg font-bold text-secondary">{completedTotal}</span>
          </div>
        </div>
      </Card>
      <Card>
        <h3 className="text-sm font-semibold text-foreground/70 mb-3">Resumen del Mes</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Km recorridos</span>
            <span className="text-lg font-bold text-primary">{kmMonth.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground/60">Entrenamientos</span>
            <span className="text-lg font-bold text-secondary">{completedMonth}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
