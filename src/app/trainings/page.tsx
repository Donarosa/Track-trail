'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import type { Training } from '@/types/database';

export default function TrainingsPage() {
  const { profile } = useAuth();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
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
            <Link key={t.id} href={`/trainings/${t.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{t.title}</h3>
                    <p className="text-sm text-foreground/60 mt-0.5">
                      {new Date(t.date).toLocaleDateString('es-AR')}
                      {t.description && ` — ${t.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === 'published' ? 'success' : 'neutral'}>
                      {t.status === 'published' ? 'Publicado' : 'Borrador'}
                    </Badge>
                    {t.version > 1 && (
                      <Badge variant="info">v{t.version}</Badge>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
