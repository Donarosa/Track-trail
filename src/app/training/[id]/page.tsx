'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/layout/AppShell';
import ResultForm from '@/components/runner/ResultForm';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import type { RunnerAssignment, TrainingBlock, Training, RunnerResult } from '@/types/database';

interface AssignmentData extends RunnerAssignment {
  training: Training;
}

export default function TrainingDetailPage() {
  const params = useParams();
  const assignmentId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [results, setResults] = useState<RunnerResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: assignData } = await supabase
        .from('runner_assignments')
        .select('*, training:trainings(*)')
        .eq('id', assignmentId)
        .single();

      if (!assignData) {
        setLoading(false);
        return;
      }

      setAssignment(assignData as unknown as AssignmentData);

      const [{ data: blocksData }, { data: resultsData }] = await Promise.all([
        supabase
          .from('training_blocks')
          .select('*')
          .eq('training_id', (assignData as unknown as AssignmentData).training.id)
          .order('order_index'),
        supabase
          .from('runner_results')
          .select('*')
          .eq('assignment_id', assignmentId),
      ]);

      setBlocks(blocksData || []);
      setResults(resultsData || []);
      setLoading(false);
    };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  const handleComplete = () => {
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <AppShell requireRole={['runner']}>
      {loading ? (
        <Spinner className="py-12" />
      ) : !assignment ? (
        <p className="text-center text-foreground/60 py-12">Entrenamiento no encontrado.</p>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{assignment.training.title}</h1>
              <p className="text-sm text-foreground/60 mt-1">
                {new Date(assignment.training.date).toLocaleDateString('es-AR')}
              </p>
              {assignment.training.description && (
                <p className="text-sm text-foreground/50 mt-2">{assignment.training.description}</p>
              )}
            </div>
            <Badge variant={assignment.status === 'completed' ? 'success' : 'warning'}>
              {assignment.status === 'completed' ? 'Completado' : 'Pendiente'}
            </Badge>
          </div>

          {assignment.status === 'completed' ? (
            <Card>
              <h3 className="font-semibold text-foreground mb-3">Resultados Cargados</h3>
              <div className="space-y-2">
                {blocks.map((block) => {
                  const result = results.find((r) => r.block_id === block.id);
                  return (
                    <div key={block.id} className="flex items-center justify-between py-2 border-b border-highlight/20 last:border-0">
                      <span className="text-sm font-medium">{block.block_name}</span>
                      <span className="text-sm text-foreground/70">
                        {result?.value_distance && `${result.value_distance} km`}
                        {result?.value_distance && result?.value_time && ' · '}
                        {result?.value_time && `${result.value_time} min`}
                        {result?.comment && result.comment}
                        {!result && '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <ResultForm
              assignmentId={assignmentId}
              blocks={blocks}
              existingResults={results}
              onComplete={handleComplete}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
