'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleSave = async () => {
    if (!profile) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'El nombre no puede estar vacío.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ name: trimmed })
      .eq('id', profile.id);

    if (error) {
      setMessage({ type: 'error', text: 'Error al guardar el nombre.' });
    } else {
      await refreshProfile();
      setMessage({ type: 'success', text: 'Nombre actualizado correctamente.' });
    }

    setSaving(false);
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-primary mb-6">Perfil</h1>

        <Card>
          <div className="space-y-4">
            <Input
              label="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
            />

            <div className="flex flex-col gap-2">
              <Input
                label="Email"
                value={profile?.email ?? ''}
                disabled
              />
              <p className="text-xs text-foreground/50">El email no se puede cambiar.</p>
            </div>

            {message && (
              <p className={`text-sm ${message.type === 'success' ? 'text-secondary' : 'text-danger'}`}>
                {message.text}
              </p>
            )}

            <Button onClick={handleSave} loading={saving} className="w-full">
              Guardar
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
