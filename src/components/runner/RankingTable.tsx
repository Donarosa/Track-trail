'use client';

import Card from '@/components/ui/Card';

interface RankingEntry {
  runner_id: string;
  runner_name: string;
  total_km?: number;
  completed_count?: number;
}

interface RankingTableProps {
  title: string;
  data: RankingEntry[];
  valueKey: 'total_km' | 'completed_count';
  unit: string;
}

export default function RankingTable({ title, data, valueKey, unit }: RankingTableProps) {
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card>
      <h3 className="text-sm font-semibold text-foreground/70 mb-3">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-foreground/40 py-2">Sin datos este mes</p>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <div
              key={entry.runner_id}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm w-6 text-center">
                  {i < 3 ? medals[i] : `${i + 1}.`}
                </span>
                <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                  {entry.runner_name}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">
                {valueKey === 'total_km'
                  ? `${Number(entry.total_km ?? 0).toFixed(1)} ${unit}`
                  : `${entry.completed_count ?? 0} ${unit}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
