'use client';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import type { BlockInputType } from '@/types/database';

export interface BlockData {
  id?: string;
  block_name: string;
  input_type: BlockInputType;
  repetitions: number;
  order_index: number;
}

interface BlockEditorProps {
  block: BlockData;
  index: number;
  onChange: (index: number, block: BlockData) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const inputTypeOptions: { value: BlockInputType; label: string }[] = [
  { value: 'distance_time', label: 'Distancia + Tiempo' },
  { value: 'distance', label: 'Solo Distancia' },
  { value: 'time', label: 'Solo Tiempo' },
  { value: 'comment', label: 'Comentario' },
];

export default function BlockEditor({
  block,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: BlockEditorProps) {
  const update = (field: keyof BlockData, value: string | number) => {
    onChange(index, { ...block, [field]: value });
  };

  return (
    <div className="border border-highlight/40 rounded-lg p-4 bg-tt-white/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground/60">Bloque {index + 1}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
            className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Mover arriba"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
            className="p-1 text-foreground/40 hover:text-foreground disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Mover abajo"
          >
            ↓
          </button>
          <Button type="button" variant="danger" size="sm" onClick={() => onRemove(index)}>
            ✕
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Nombre del bloque"
          value={block.block_name}
          onChange={(e) => update('block_name', e.target.value)}
          placeholder="Ej: Calentamiento"
          required
        />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Tipo de input</label>
          <select
            value={block.input_type}
            onChange={(e) => update('input_type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-highlight/50 bg-tt-white text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            {inputTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Repeticiones"
          type="number"
          min={1}
          value={block.repetitions}
          onChange={(e) => update('repetitions', parseInt(e.target.value) || 1)}
        />
      </div>
    </div>
  );
}
