'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import { formatDate, formatTimeHMS } from '@/utils/formatters';

interface BlockResult {
  id: string;
  block_id: string;
  value_distance: number | null;
  value_time: number | null;
  value_elevation: number | null;
  comment: string | null;
}

interface CompletedRow {
  id: string;
  created_at: string;
  runner_name: string;
  training_title: string;
  training_date: string;
  blocks: {
    block_name: string;
    value_distance: number | null;
    value_time: number | null;
    value_elevation: number | null;
  }[];
  totals: {
    distance: number;
    time: number;
    elevation: number;
  };
}

const PAGE_SIZE = 10;

type SortField = 'date' | 'runner';
type SortDir = 'asc' | 'desc';

export default function CompletedActivitiesTable() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [allRows, setAllRows] = useState<CompletedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    if (!profile) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Reset page when search or sort changes
  useEffect(() => {
    setPage(0);
  }, [search, sortField, sortDir]);

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);

    const { data } = await supabase
      .from('runner_assignments')
      .select(`
        id,
        created_at,
        user:users!runner_assignments_runner_id_fkey(name, email),
        training:trainings!inner(title, date, trainer_id, training_blocks(id, block_name, order_index)),
        runner_results(id, block_id, value_distance, value_time, value_elevation, comment)
      `)
      .eq('status', 'completed')
      .eq('training.trainer_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) {
      const mapped: CompletedRow[] = data.map((item: Record<string, unknown>) => {
        const user = item.user as { name: string | null; email: string } | null;
        const training = item.training as {
          title: string;
          date: string;
          training_blocks: { id: string; block_name: string; order_index: number }[];
        };
        const results = item.runner_results as BlockResult[];

        const sortedBlocks = [...training.training_blocks].sort(
          (a, b) => a.order_index - b.order_index
        );

        const blocks = sortedBlocks.map((block) => {
          const result = results.find((r) => r.block_id === block.id);
          return {
            block_name: block.block_name,
            value_distance: result?.value_distance ?? null,
            value_time: result?.value_time ?? null,
            value_elevation: result?.value_elevation ?? null,
          };
        });

        const totals = {
          distance: blocks.reduce((sum, b) => sum + (b.value_distance ?? 0), 0),
          time: blocks.reduce((sum, b) => sum + (b.value_time ?? 0), 0),
          elevation: blocks.reduce((sum, b) => sum + (b.value_elevation ?? 0), 0),
        };

        return {
          id: item.id as string,
          created_at: item.created_at as string,
          runner_name: user?.name || user?.email || 'Sin nombre',
          training_title: training.title,
          training_date: training.date,
          blocks,
          totals,
        };
      });

      setAllRows(mapped);
    }

    setLoading(false);
  };

  // Filter + sort + paginate
  const filtered = allRows.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return row.runner_name.toLowerCase().includes(q) || row.training_title.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'date') {
      return (a.training_date > b.training_date ? 1 : -1) * dir;
    }
    return a.runner_name.localeCompare(b.runner_name) * dir;
  });

  const totalCount = sorted.length;
  const rows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'date' ? 'desc' : 'asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-3 h-3 ml-1 inline text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDir === 'asc' ? (
      <svg className="w-3 h-3 ml-1 inline text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 ml-1 inline text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (loading && allRows.length === 0) return <Spinner className="py-8" />;

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between px-3 py-2 gap-3">
        <h2 className="text-lg font-semibold text-foreground shrink-0">Actividades Completadas</h2>
        <div className="relative max-w-xs w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar runner o actividad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-highlight/50 bg-tt-white text-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-highlight/30 text-foreground/60">
              <th className="text-left py-2 px-3 font-medium w-8"></th>
              <th className="text-left py-2 px-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort('runner')}>
                Runner<SortIcon field="runner" />
              </th>
              <th className="text-left py-2 px-3 font-medium">Actividad</th>
              <th className="text-left py-2 px-3 font-medium cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort('date')}>
                Fecha<SortIcon field="date" />
              </th>
              <th className="text-right py-2 px-3 font-medium">Km</th>
              <th className="text-right py-2 px-3 font-medium">Tiempo</th>
              <th className="text-right py-2 px-3 font-medium">Altimetría</th>
            </tr>
          </thead>
          <tbody>
            {rows.flatMap((row) => {
              const hasMultipleBlocks = row.blocks.length > 1;
              const isExpanded = expandedRows.has(row.id);

              const mainRow = (
                <tr
                  key={row.id}
                  className={`border-b border-highlight/20 ${hasMultipleBlocks ? 'cursor-pointer hover:bg-highlight/10' : ''}`}
                  onClick={() => hasMultipleBlocks && toggleExpand(row.id)}
                >
                  <td className="py-2 px-3 w-8">
                    {hasMultipleBlocks && (
                      <svg
                        className={`w-4 h-4 text-foreground/40 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </td>
                  <td className="py-2 px-3 font-medium text-foreground">{row.runner_name}</td>
                  <td className="py-2 px-3 text-foreground/80">{row.training_title}</td>
                  <td className="py-2 px-3 text-foreground/60">{formatDate(row.training_date)}</td>
                  <td className="py-2 px-3 text-right text-foreground/80">
                    {row.totals.distance > 0 ? `${row.totals.distance.toFixed(1)}` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-foreground/80">
                    {row.totals.time > 0 ? formatTimeHMS(row.totals.time) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-foreground/80">
                    {row.totals.elevation > 0 ? `${row.totals.elevation.toFixed(0)} m` : '—'}
                  </td>
                </tr>
              );

              if (!isExpanded) return [mainRow];

              const blockRows = row.blocks.map((block, i) => (
                <tr key={`${row.id}-block-${i}`} className="bg-highlight/5 border-b border-highlight/10">
                  <td className="py-1.5 px-3"></td>
                  <td className="py-1.5 px-3" colSpan={2}>
                    <span className="text-xs text-foreground/50 pl-4">↳ {block.block_name}</span>
                  </td>
                  <td className="py-1.5 px-3"></td>
                  <td className="py-1.5 px-3 text-right text-xs text-foreground/60">
                    {block.value_distance ? `${block.value_distance.toFixed(1)}` : '—'}
                  </td>
                  <td className="py-1.5 px-3 text-right text-xs text-foreground/60">
                    {block.value_time ? formatTimeHMS(block.value_time) : '—'}
                  </td>
                  <td className="py-1.5 px-3 text-right text-xs text-foreground/60">
                    {block.value_elevation ? `${block.value_elevation.toFixed(0)} m` : '—'}
                  </td>
                </tr>
              ));

              return [mainRow, ...blockRows];
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile sort buttons */}
      <div className="md:hidden flex gap-2 px-2 mb-2">
        <button
          onClick={() => toggleSort('date')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${sortField === 'date' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-highlight/30 text-foreground/60'}`}
        >
          Fecha<SortIcon field="date" />
        </button>
        <button
          onClick={() => toggleSort('runner')}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border ${sortField === 'runner' ? 'border-primary/50 bg-primary/10 text-primary' : 'border-highlight/30 text-foreground/60'}`}
        >
          Runner<SortIcon field="runner" />
        </button>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2 px-1">
        {rows.map((row) => {
          const hasMultipleBlocks = row.blocks.length > 1;
          const isExpanded = expandedRows.has(row.id);

          return (
            <div
              key={row.id}
              className="border border-highlight/20 rounded-lg p-3"
            >
              <div
                className={`flex items-start justify-between ${hasMultipleBlocks ? 'cursor-pointer' : ''}`}
                onClick={() => hasMultipleBlocks && toggleExpand(row.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{row.runner_name}</p>
                  <p className="text-xs text-foreground/60 truncate">{row.training_title}</p>
                  <p className="text-xs text-foreground/40 mt-0.5">{formatDate(row.training_date)}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  {row.totals.distance > 0 && (
                    <p className="text-sm font-medium text-primary">{row.totals.distance.toFixed(1)} km</p>
                  )}
                  {row.totals.time > 0 && (
                    <p className="text-xs text-foreground/60">{formatTimeHMS(row.totals.time)}</p>
                  )}
                  {row.totals.elevation > 0 && (
                    <p className="text-xs text-foreground/60">{row.totals.elevation.toFixed(0)} m</p>
                  )}
                </div>
                {hasMultipleBlocks && (
                  <svg
                    className={`w-4 h-4 text-foreground/40 ml-2 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-highlight/20 space-y-1.5">
                  {row.blocks.map((block, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-foreground/50">↳ {block.block_name}</span>
                      <div className="flex gap-3 text-foreground/60">
                        {block.value_distance != null && <span>{block.value_distance.toFixed(1)} km</span>}
                        {block.value_time != null && <span>{formatTimeHMS(block.value_time)}</span>}
                        {block.value_elevation != null && <span>{block.value_elevation.toFixed(0)} m</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {rows.length === 0 && !loading && (
        <p className="text-center text-foreground/50 py-8 text-sm">
          Aún no hay actividades completadas.
        </p>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-3 border-t border-highlight/20 mt-2">
          <p className="text-xs text-foreground/50">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} de {totalCount}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 text-xs rounded-lg border border-highlight/30 text-foreground/70 hover:bg-highlight/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1 text-xs rounded-lg border border-highlight/30 text-foreground/70 hover:bg-highlight/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
