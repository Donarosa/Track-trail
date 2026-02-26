'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';

type LoginRole = 'runner' | 'trainer';

const tabs = [
  { key: 'runner', label: 'Corredor' },
  { key: 'trainer', label: 'Entrenador' },
];

export default function LoginPage() {
  const [role, setRole] = useState<LoginRole>('runner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Detectar si el email es de superadmin para mostrar campo de contraseña
  const isSuperadminEmail = email.trim().toLowerCase() === 'superadmin@trail.com';

  const handleOtpLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    // Si es entrenador, validar que esté autorizado
    if (role === 'trainer') {
      const { data: trainer } = await supabase
        .from('authorized_trainers')
        .select('id, status')
        .eq('email', email)
        .single();

      if (!trainer) {
        setError('Este email no está autorizado como entrenador.');
        setLoading(false);
        return;
      }
      if (trainer.status === 'paused') {
        setError('Tu cuenta de entrenador está pausada. Contacta al administrador.');
        setLoading(false);
        return;
      }
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      setError(otpError.message);
    } else {
      setMessage('Código enviado a tu email.');
      router.push(`/verify-otp?email=${encodeURIComponent(email)}&role=${role}`);
    }
    setLoading(false);
  };

  const handlePasswordLogin = async () => {
    setLoading(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'trainer' && isSuperadminEmail) {
      handlePasswordLogin();
    } else {
      handleOtpLogin();
    }
  };

  return (
    <Card padding="lg">
      <Tabs
        tabs={tabs}
        defaultTab="runner"
        onChange={(key) => {
          setRole(key as LoginRole);
          setError('');
          setMessage('');
        }}
        className="mb-6"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {role === 'trainer' && isSuperadminEmail && (
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        )}

        {error && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
        )}
        {message && (
          <p className="text-sm text-secondary bg-secondary/10 rounded-lg px-3 py-2">{message}</p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          {role === 'trainer' && isSuperadminEmail ? 'Iniciar Sesión' : 'Enviar Código'}
        </Button>
      </form>

      {role === 'runner' && (
        <p className="text-xs text-foreground/50 text-center mt-4">
          Si es tu primera vez, se creará tu cuenta automáticamente.
        </p>
      )}
    </Card>
  );
}
