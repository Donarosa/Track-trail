'use client';

import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export interface BlockData {
  id?: string;
  block_name: string;
  has_distance: boolean;
  has_time: boolean;
  has_elevation: boolean;
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex flex-col items-center gap-1.5"
    >
      <span className="text-xs font-medium text-foreground/70">{label}</span>
      <div
        className={`
          relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer
          ${checked ? 'bg-secondary' : 'bg-foreground/20'}
        `}
      >
        <div
          className={`
            absolute top-0.5 w-4.5 h-4.5 rounded-full bg-tt-white shadow transition-transform duration-200
            ${checked ? 'translate-x-5' : 'translate-x-0.5'}
          `}
        />
      </div>
    </button>
  );
}

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
  const update = (field: keyof BlockData, value: string | boolean) => {
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

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="flex-1 w-full sm:w-auto">
          <Input
            label="Nombre del bloque"
            value={block.block_name}
            onChange={(e) => update('block_name', e.target.value)}
            placeholder="Ej: Calentamiento"
            required
          />
        </div>

        <div className="flex gap-5 pt-1">
          <Toggle
            label="Distancia"
            checked={block.has_distance}
            onChange={(v) => update('has_distance', v)}
          />
          <Toggle
            label="Tiempo"
            checked={block.has_time}
            onChange={(v) => update('has_time', v)}
          />
          <Toggle
            label="Desnivel"
            checked={block.has_elevation}
            onChange={(v) => update('has_elevation', v)}
          />
        </div>
      </div>
    </div>
  );
}
