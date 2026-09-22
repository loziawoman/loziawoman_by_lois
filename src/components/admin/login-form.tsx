'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { TextField } from '@/components/forms/fields';
import { apiRequest, jsonBody } from '@/lib/api/client';

export function AdminLoginForm({ configured, forbidden }: { configured: boolean; forbidden: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(forbidden ? 'That account does not have access to the studio desk.' : '');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError('');
    const result = await apiRequest('/api/auth/login', { method: 'POST', body: jsonBody({ email: data.get('email'), password: data.get('password') }) });
    setBusy(false);
    if (!result.ok) { setError(result.message); return; }
    router.replace('/admin');
    router.refresh();
  };

  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-[420px]">
        <p className="serif text-[34px] leading-none tracking-[.2em]">LOZIA</p>
        <p className="mono mt-2 text-[hsl(var(--muted-foreground))]">Studio desk</p>
        {configured ? (
          <form onSubmit={submit} className="mt-12 grid gap-5" noValidate>
            <TextField id="email" name="email" type="email" label="Email" required autoComplete="username" autoFocus />
            <TextField id="password" name="password" type="password" label="Password" required autoComplete="current-password" />
            {error && <p role="alert" className="text-sm text-[hsl(var(--destructive))]" data-testid="text-admin-login-error">{error}</p>}
            <button type="submit" disabled={busy} className="mt-2 inline-flex min-h-12 w-fit items-center gap-3 bg-[hsl(var(--primary))] px-6 mono text-[hsl(var(--primary-foreground))] disabled:opacity-50" data-testid="button-admin-sign-in">
              {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={15} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <p className="mt-12 text-sm leading-6 text-[hsl(var(--muted-foreground))]">Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example), then restart.</p>
        )}
      </div>
    </div>
  );
}
