'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import type { AuthorizedTrainer } from '@/types/database';

interface TrainerManagerProps {
  trainers: AuthorizedTrainer[];
  onUpdate: () => void;
}

export default function TrainerManager({ trainers, onUpdate }: TrainerManagerProps) {
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const supabase = createClient();

  const addTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setAdding(true);
    setError('');

    const { error: insertError } = await supabase
      .from('authorized_trainers')
      .insert({ email: email.trim().toLowerCase() });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Este email ya está registrado.');
      } else {
        setError(insertError.message);
      }
    } else {
      setEmail('');
      onUpdate();
    }
    setAdding(false);
  };

  const toggleStatus = async (trainer: AuthorizedTrainer) => {
    setActionLoading(trainer.id);
    const newStatus = trainer.status === 'active' ? 'paused' : 'active';

    await supabase
      .from('authorized_trainers')
      .update({ status: newStatus })
      .eq('id', trainer.id);

    setActionLoading(null);
    onUpdate();
  };

  const removeTrainer = async (id: string) => {
    setActionLoading(id);
    await supabase.from('authorized_trainers').delete().eq('id', id);
    setActionLoading(null);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <Card padding="lg">
        <h3 className="font-semibold text-foreground mb-3">Agregar Entrenador</h3>
        <form onSubmit={addTrainer} className="flex gap-3">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="email@entrenador.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" loading={adding}>
            Agregar
          </Button>
        </form>
        {error && (
          <p className="text-sm text-danger mt-2">{error}</p>
        )}
      </Card>

      <Card>
        <h3 className="font-semibold text-foreground mb-3">Entrenadores Autorizados</h3>
        {trainers.length === 0 ? (
          <p className="text-sm text-foreground/50 py-4 text-center">
            No hay entrenadores autorizados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-highlight/30">
                  <th className="text-left py-3 px-2 font-medium text-foreground/60">Email</th>
                  <th className="text-left py-3 px-2 font-medium text-foreground/60">Estado</th>
                  <th className="text-left py-3 px-2 font-medium text-foreground/60">Registrado</th>
                  <th className="text-right py-3 px-2 font-medium text-foreground/60">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((t) => (
                  <tr key={t.id} className="border-b border-highlight/20">
                    <td className="py-3 px-2">{t.email}</td>
                    <td className="py-3 px-2">
                      <Badge variant={t.status === 'active' ? 'success' : 'warning'}>
                        {t.status === 'active' ? 'Activo' : 'Pausado'}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-foreground/60">
                      {new Date(t.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={actionLoading === t.id}
                          onClick={() => toggleStatus(t)}
                        >
                          {t.status === 'active' ? 'Pausar' : 'Activar'}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          loading={actionLoading === t.id}
                          onClick={() => removeTrainer(t.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
