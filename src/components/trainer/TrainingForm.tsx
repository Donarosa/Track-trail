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
// BlockInputType derivado automáticamente de toggles

interface TrainingFormProps {
  training?: Training;
  existingBlocks?: TrainingBlock[];
}

export default function TrainingForm({ training, existingBlocks }: TrainingFormProps) {
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
    })) ?? [
      { block_name: '', has_distance: true, has_time: true, has_elevation: false, order_index: 0 },
    ]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!training;

  const addBlock = () => {
    setBlocks([
      ...blocks,
      { block_name: '', has_distance: true, has_time: true, has_elevation: false, order_index: blocks.length },
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
        // Si estamos editando un entrenamiento ya publicado, incrementar version
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

        // Eliminar bloques anteriores y recrear
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

      // Insertar bloques
      const blocksToInsert = blocks.map((b, i) => {
        // Derivar input_type para backward compat
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

      // Publicar si se solicitó
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
              placeholder="Breve descripción del entrenamiento"
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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Bloques</h2>
          <Button type="button" variant="secondary" size="sm" onClick={addBlock}>
            + Agregar Bloque
          </Button>
        </div>

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
            />
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3">
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
