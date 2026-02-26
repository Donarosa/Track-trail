'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('No estás autenticado. Vuelve a iniciar sesión.');
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update({ name })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      router.push('/');
    }

    setLoading(false);
  };

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-2">Completa tu Perfil</h2>
      <p className="text-sm text-foreground/60 mb-6">
        Ingresa tu nombre para que tu entrenador pueda identificarte.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre"
          type="text"
          placeholder="Tu nombre completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        {error && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Continuar
        </Button>
      </form>
    </Card>
  );
}
