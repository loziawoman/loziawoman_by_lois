'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Could not sign in. Try again.');
    } catch {
      setError('Could not reach the server. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grain flex min-h-[100dvh] items-center justify-center bg-[hsl(var(--background))] px-5 py-16">
      <div className="w-full max-w-[420px]">
        <p className="serif text-[34px] leading-none tracking-[-.04em]">LOZIA</p>
        <p className="mono mt-2 text-[hsl(var(--muted-foreground))]">Studio desk</p>

        {configured ? (
          <form onSubmit={submit} className="mt-12 grid gap-5">
            <label className="grid gap-2 text-xs">
              <span className="mono">Password</span>
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="border-b border-[hsl(var(--border))] bg-transparent px-1 py-3 text-sm outline-none focus:border-[hsl(var(--primary))]"
                data-testid="input-admin-password"
              />
            </label>
            {error ? (
              <p role="alert" className="text-sm text-[hsl(var(--destructive))]" data-testid="text-admin-login-error">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={busy || !password}
              className="mt-2 inline-flex w-fit items-center gap-3 bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] disabled:opacity-40"
              data-testid="button-admin-sign-in"
            >
              {busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          <p className="mt-12 text-sm leading-6 text-[hsl(var(--muted-foreground))]" data-testid="text-admin-not-configured">
            Sign-in is not set up yet. Add ADMIN_PASSWORD and ADMIN_SESSION_SECRET (at least 32 characters) to the
            server environment, then restart. See .env.example.
          </p>
        )}
      </div>
    </div>
  );
}
