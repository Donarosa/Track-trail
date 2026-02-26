'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import type { TrainingBlock, RunnerResult } from '@/types/database';

interface ResultFormProps {
  assignmentId: string;
  blocks: TrainingBlock[];
  existingResults: RunnerResult[];
  onComplete: () => void;
}

interface BlockResult {
  block_id: string;
  value_distance: string;
  value_time: string;
  comment: string;
}

export default function ResultForm({ assignmentId, blocks, existingResults, onComplete }: ResultFormProps) {
  const supabase = createClient();

  const initResults = (): BlockResult[] =>
    blocks.map((block) => {
      const existing = existingResults.find((r) => r.block_id === block.id);
      return {
        block_id: block.id,
        value_distance: existing?.value_distance?.toString() ?? '',
        value_time: existing?.value_time?.toString() ?? '',
        comment: existing?.comment ?? '',
      };
    });

  const [results, setResults] = useState<BlockResult[]>(initResults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateResult = (index: number, field: keyof BlockResult, value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      // Delete existing results and re-insert
      await supabase.from('runner_results').delete().eq('assignment_id', assignmentId);

      const resultsToInsert = results
        .filter((r) => r.value_distance || r.value_time || r.comment)
        .map((r) => ({
          assignment_id: assignmentId,
          block_id: r.block_id,
          value_distance: r.value_distance ? parseFloat(r.value_distance) : null,
          value_time: r.value_time ? parseFloat(r.value_time) : null,
          comment: r.comment || null,
        }));

      if (resultsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('runner_results')
          .insert(resultsToInsert);

        if (insertError) throw insertError;
      }

      // Mark assignment as completed
      await supabase
        .from('runner_assignments')
        .update({ status: 'completed' })
        .eq('id', assignmentId);

      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al guardar resultados';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => (
        <Card key={block.id} padding="md">
          <h4 className="font-medium text-foreground mb-2">
            {block.block_name}
            {block.repetitions > 1 && (
              <span className="text-foreground/50 font-normal"> x{block.repetitions}</span>
            )}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(block.input_type === 'distance_time' || block.input_type === 'distance') && (
              <Input
                label="Distancia (km)"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={results[index]?.value_distance ?? ''}
                onChange={(e) => updateResult(index, 'value_distance', e.target.value)}
              />
            )}

            {(block.input_type === 'distance_time' || block.input_type === 'time') && (
              <Input
                label="Tiempo (minutos)"
                type="number"
                step="0.1"
                min="0"
                placeholder="0.0"
                value={results[index]?.value_time ?? ''}
                onChange={(e) => updateResult(index, 'value_time', e.target.value)}
              />
            )}

            {block.input_type === 'comment' && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-foreground mb-1 block">Comentario</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-highlight/50 bg-tt-white text-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  rows={2}
                  placeholder="Tu comentario..."
                  value={results[index]?.comment ?? ''}
                  onChange={(e) => updateResult(index, 'comment', e.target.value)}
                />
              </div>
            )}
          </div>
        </Card>
      ))}

      {error && (
        <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <Button onClick={handleSubmit} loading={saving} className="w-full">
        Completar Entrenamiento
      </Button>
    </div>
  );
}
