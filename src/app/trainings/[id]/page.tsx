'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import AppShell from '@/components/layout/AppShell';
import TrainingForm from '@/components/trainer/TrainingForm';
import Spinner from '@/components/ui/Spinner';
import type { Training, TrainingBlock } from '@/types/database';

export default function EditTrainingPage() {
  const params = useParams();
  const id = params.id as string;
  const [training, setTraining] = useState<Training | null>(null);
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const [{ data: t }, { data: b }] = await Promise.all([
        supabase.from('trainings').select('*').eq('id', id).single(),
        supabase
          .from('training_blocks')
          .select('*')
          .eq('training_id', id)
          .order('order_index'),
      ]);

      setTraining(t);
      setBlocks(b || []);
      setLoading(false);
    };

    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <AppShell requireRole={['trainer', 'superadmin']}>
      {loading ? (
        <Spinner className="py-12" />
      ) : training ? (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-6">Editar Entrenamiento</h1>
          <TrainingForm training={training} existingBlocks={blocks} />
        </>
      ) : (
        <p className="text-center text-foreground/60 py-12">Entrenamiento no encontrado.</p>
      )}
    </AppShell>
  );
}
