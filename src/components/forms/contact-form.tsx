'use client';

import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { apiRequest, jsonBody } from '@/lib/api/client';
import { TextArea, TextField, firstError } from './fields';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus('sending');
    setError('');
    setFieldErrors({});
    const result = await apiRequest('/api/contact', {
      method: 'POST',
      body: jsonBody({ name: data.get('name'), email: data.get('email'), message: data.get('message'), website: data.get('website') || undefined }),
    });
    if (result.ok) {
      form.reset();
      setStatus('sent');
    } else {
      setStatus('idle');
      setError(result.message);
      setFieldErrors(result.fieldErrors);
    }
  };

  if (status === 'sent') {
    return (
      <div role="status" className="border border-[hsl(var(--border))] p-8" data-testid="contact-success">
        <h3 className="serif text-3xl">Thank you.</h3>
        <p className="mt-3 text-sm leading-7 text-[hsl(var(--muted-foreground))]">Your message has reached the studio. We will reply to the email address you gave us.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      <TextField id="contact-name" name="name" label="Name" required autoComplete="name" error={firstError(fieldErrors, 'name')} data-testid="contact-name" />
      <TextField id="contact-email" name="email" type="email" label="Email" required autoComplete="email" error={firstError(fieldErrors, 'email')} data-testid="contact-email" />
      <TextArea id="contact-message" name="message" label="Message" required rows={5} error={firstError(fieldErrors, 'message')} data-testid="contact-message" />
      {/* Honeypot: hidden from people, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      {error && <p role="alert" className="text-sm text-[hsl(var(--destructive))]">{error}</p>}
      <button type="submit" disabled={status === 'sending'} className="mt-2 inline-flex min-h-12 w-fit items-center gap-3 bg-[hsl(var(--primary))] px-6 py-4 mono text-[hsl(var(--primary-foreground))] disabled:opacity-50" data-testid="contact-submit">
        {status === 'sending' ? 'Sending…' : 'Send message'} <ArrowRight size={15} aria-hidden="true" />
      </button>
    </form>
  );
}
