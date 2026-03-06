'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import BlockEditor, { type BlockData } from '@/components/trainer/BlockEditor';
import type { Training, TrainingBlock } from '@/types/database';

interface TrainingFormProps {
  training?: Training;
  existingBlocks?: TrainingBlock[];
  trainingType?: string;
  trainingTypeLabel?: string;
  onExit?: () => void;
}

function getInitialBlocks(trainingType?: string): BlockData[] {
  switch (trainingType) {
    case 'cuestas':
      return [
        { block_name: 'Transición', has_distance: true, has_time: true, has_elevation: false, order_index: 0 },
        { block_name: '', has_distance: true, has_time: true, has_elevation: false, order_index: 1 },
      ];
    case 'fondo':
    case 'libre':
      return [
        { block_name: '', has_distance: true, has_time: true, has_elevation: true, order_index: 0 },
      ];
    default: // pasadas, cambio_ritmo, or no type
      return [
        { block_name: '', has_distance: true, has_time: true, has_elevation: false, order_index: 0 },
      ];
  }
}

function getBlockPlaceholder(trainingType: string | undefined, blockIndex: number): string {
  switch (trainingType) {
    case 'pasadas':
      return `Pasada ${blockIndex + 1}`;
    case 'cuestas':
      if (blockIndex === 0) return 'Transición';
      return `Cuesta ${blockIndex}`;
    case 'cambio_ritmo':
      if (blockIndex === 0) return 'Primer pasada';
      return `Bloque ${blockIndex + 1}`;
    default:
      return 'Ej: Calentamiento';
  }
}

export default function TrainingForm({ training, existingBlocks, trainingType, trainingTypeLabel, onExit }: TrainingFormProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(training?.title ?? '');
  const [description, setDescription] = useState(training?.description ?? '');
  const [date, setDate] = useState(training?.date ?? new Date().toISOString().split('T')[0]);
  const [blocks, setBlocks] = useState<BlockData[]>(
    existingBlocks?.map((b) => ({
      id: b.id,
      block_name: b.block_name,
      has_distance: b.has_distance ?? false,
      has_time: b.has_time ?? false,
      has_elevation: b.has_elevation ?? false,
      order_index: b.order_index,
    })) ?? getInitialBlocks(trainingType)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!training;

  const addBlock = () => {
    const newIndex = blocks.length;
    const useElevation = trainingType === 'fondo' || trainingType === 'libre';
    setBlocks([
      ...blocks,
      { block_name: '', has_distance: true, has_time: true, has_elevation: useElevation, order_index: newIndex },
    ]);
  };

  const updateBlock = (index: number, block: BlockData) => {
    const newBlocks = [...blocks];
    newBlocks[index] = block;
    setBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) return;
    const newBlocks = blocks.filter((_, i) => i !== index).map((b, i) => ({ ...b, order_index: i }));
    setBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[swapIndex]] = [newBlocks[swapIndex], newBlocks[index]];
    setBlocks(newBlocks.map((b, i) => ({ ...b, order_index: i })));
  };

  const handleSave = async (publish: boolean) => {
    if (!profile) return;
    if (!title.trim()) {
      setError('El título es obligatorio.');
      return;
    }
    if (blocks.some((b) => !b.block_name.trim())) {
      setError('Todos los bloques deben tener nombre.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let trainingId = training?.id;

      if (isEditing && training) {
        const newVersion = training.status === 'published' ? training.version + 1 : training.version;

        const { error: updateError } = await supabase
          .from('trainings')
          .update({
            title,
            description: description || null,
            date,
            version: newVersion,
          })
          .eq('id', training.id);

        if (updateError) throw updateError;

        const { error: deleteError } = await supabase
          .from('training_blocks')
          .delete()
          .eq('training_id', training.id);

        if (deleteError) throw deleteError;
      } else {
        const { data, error: insertError } = await supabase
          .from('trainings')
          .insert({
            trainer_id: profile.id,
            title,
            description: description || null,
            date,
            status: 'draft',
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        trainingId = data.id;
      }

      const blocksToInsert = blocks.map((b, i) => {
        let input_type = 'comment';
        if (b.has_distance && b.has_time) input_type = 'distance_time';
        else if (b.has_distance) input_type = 'distance';
        else if (b.has_time) input_type = 'time';

        return {
          training_id: trainingId!,
          block_name: b.block_name,
          input_type,
          has_distance: b.has_distance,
          has_time: b.has_time,
          has_elevation: b.has_elevation,
          repetitions: 1,
          order_index: i,
        };
      });

      const { error: blocksError } = await supabase
        .from('training_blocks')
        .insert(blocksToInsert);

      if (blocksError) throw blocksError;

      if (publish && trainingId) {
        const { error: publishError } = await supabase.rpc('publish_training', {
          p_training_id: trainingId,
        });
        if (publishError) throw publishError;
      }

      router.push('/trainings');
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message || JSON.stringify(err);
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Botón volver */}
      {onExit && (
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
      )}
      <h1 className="text-2xl font-bold text-foreground">
        {isEditing ? 'Editar Entrenamiento' : `Nuevo ${trainingTypeLabel || 'Entrenamiento'}`}
      </h1>

      <Card padding="lg">
        <div className="space-y-4">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Entrenamiento de fondo"
            required
          />
          <div className="flex flex-col gap-1">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Descripción
            </label>
            <textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción completa del ejercicio. Ej Vuelta larga: Salimos desde la plaza, bajamos por butori, costanera, puente del ancla, calle Alem, Sierras Hotel, Museo Dubois, Gym. Aprox 6.30km Vuelta corta: salimos desde la plaza, bajamos por butori, costanera, puente del ancla, Gym. Aprox 4.0km"
              className="w-full px-3 py-2 rounded-lg border border-highlight/50 bg-tt-white text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all duration-200 resize-y"
            />
          </div>
          <Input
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Bloques</h2>

        <div className="space-y-3">
          {blocks.map((block, index) => (
            <BlockEditor
              key={index}
              block={block}
              index={index}
              onChange={updateBlock}
              onRemove={removeBlock}
              onMoveUp={(i) => moveBlock(i, 'up')}
              onMoveDown={(i) => moveBlock(i, 'down')}
              isFirst={index === 0}
              isLast={index === blocks.length - 1}
              placeholder={getBlockPlaceholder(trainingType, index)}
            />
          ))}
        </div>

        <div className="mt-4">
          <Button type="button" variant="secondary" size="sm" onClick={addBlock} className="w-full sm:w-auto">
            + Agregar Bloque
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 justify-center">
        <Button
          onClick={() => handleSave(false)}
          loading={saving}
          variant="secondary"
        >
          Guardar Borrador
        </Button>
        <Button
          onClick={() => handleSave(true)}
          loading={saving}
        >
          Publicar
        </Button>
      </div>
    </div>
  );
}
