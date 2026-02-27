'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import type { Training } from '@/types/database';

export default function TrainingsPage() {
  const { profile } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Training | null>(null);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!profile) return;

    const fetch = async () => {
      const { data } = await supabase
        .from('trainings')
        .select('*')
        .eq('trainer_id', profile.id)
        .order('date', { ascending: false });

      setTrainings(data || []);
      setLoading(false);
    };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from('trainings')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      alert('Error al eliminar: ' + error.message);
    } else {
      setTrainings((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <AppShell requireRole={['trainer', 'superadmin']}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Entrenamientos</h1>
        <Link href="/trainings/new">
          <Button>+ Nuevo</Button>
        </Link>
      </div>

      {loading ? (
        <Spinner className="py-12" />
      ) : trainings.length === 0 ? (
        <Card>
          <p className="text-center text-foreground/60 py-8">
            No hay entrenamientos todavía. Crea el primero.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {trainings.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <Link href={`/trainings/${t.id}`} className="flex-1 min-w-0 cursor-pointer">
                  <h3 className="font-semibold text-foreground">{t.title}</h3>
                  <p className="text-sm text-foreground/60 mt-0.5">
                    {new Date(t.date).toLocaleDateString('es-AR')}
                    {t.description && ` — ${t.description}`}
                  </p>
                </Link>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <Badge variant={t.status === 'published' ? 'success' : 'neutral'}>
                    {t.status === 'published' ? 'Publicado' : 'Borrador'}
                  </Badge>
                  {t.version > 1 && (
                    <Badge variant="info">v{t.version}</Badge>
                  )}
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="p-1.5 rounded-lg text-foreground/40 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                    aria-label="Eliminar entrenamiento"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar entrenamiento"
      >
        <p className="text-foreground/80 mb-1">
          Vas a eliminar <strong>{deleteTarget?.title}</strong>.
        </p>
        <p className="text-sm text-foreground/60 mb-6">
          Se borrarán también las asignaciones y resultados asociados. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancelar
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
