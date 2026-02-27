'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

function VerifyOtpForm() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const role = searchParams.get('role') || 'runner';
  const supabase = createClient();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    // Verificar si el usuario ya tiene nombre (perfil completo)
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('name')
        .eq('id', data.user.id)
        .single();

      if (role === 'runner' && (!profile?.name)) {
        router.push('/register');
      } else {
        router.push('/');
      }
    }

    setLoading(false);
  };

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-2">Verificar Código</h2>
      <p className="text-sm text-foreground/60 mb-6">
        Ingresa el código que enviamos a <strong>{email}</strong>
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          label="Código"
          type="text"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={8}
          required
          autoFocus
        />

        {error && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Verificar
        </Button>
      </form>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<Card padding="lg"><p className="text-center text-foreground/60">Cargando...</p></Card>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
