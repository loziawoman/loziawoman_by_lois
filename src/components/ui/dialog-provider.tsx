'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type Tone = 'default' | 'danger';

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" turns the confirm button red and focuses Cancel first. */
  tone?: Tone;
};

export type AlertOptions = { title?: string; message: string; okLabel?: string };

type Pending =
  | { id: number; kind: 'confirm'; opts: ConfirmOptions; resolve: (value: boolean) => void }
  | { id: number; kind: 'alert'; opts: AlertOptions; resolve: () => void };

type DialogApi = {
  /** Resolves true when the person confirms, false when they cancel, press Escape or click outside. */
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  /** Resolves once the person dismisses the message. */
  alert: (options: AlertOptions | string) => Promise<void>;
};

const DialogContext = createContext<DialogApi | null>(null);

export function useDialog(): DialogApi {
  const api = useContext(DialogContext);
  if (!api) throw new Error('useDialog must be used inside <DialogProvider>.');
  return api;
}

const cancelCls = 'inline-flex min-h-11 items-center justify-center border border-[hsl(var(--border))] px-5 text-xs uppercase tracking-[.12em] hover:border-[hsl(var(--primary))]';
const confirmCls = 'inline-flex min-h-11 items-center justify-center bg-[hsl(var(--primary))] px-5 text-xs uppercase tracking-[.12em] text-[hsl(var(--primary-foreground))] hover:opacity-90';
const dangerCls = 'inline-flex min-h-11 items-center justify-center bg-red-700 px-5 text-xs uppercase tracking-[.12em] text-white hover:bg-red-800';

export function DialogProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Pending[]>([]);
  const nextId = useRef(1);
  const closedId = useRef(0);
  const current = queue[0] ?? null;

  const api = useMemo<DialogApi>(() => ({
    confirm: (options) => new Promise<boolean>((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      setQueue((q) => [...q, { id: nextId.current++, kind: 'confirm', opts, resolve }]);
    }),
    alert: (options) => new Promise<void>((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      setQueue((q) => [...q, { id: nextId.current++, kind: 'alert', opts, resolve }]);
    }),
  }), []);

  const close = (result: boolean) => {
    if (!current || closedId.current === current.id) return; // ignore double clicks
    closedId.current = current.id;
    if (current.kind === 'confirm') current.resolve(result);
    else current.resolve();
    setQueue((q) => q.slice(1));
  };

  return (
    <DialogContext.Provider value={api}>
      {children}
      {current && <DialogView key={current.id} pending={current} onClose={close} />}
    </DialogContext.Provider>
  );
}

function DialogView({ pending, onClose }: { pending: Pending; onClose: (result: boolean) => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const isConfirm = pending.kind === 'confirm';
  const danger = pending.kind === 'confirm' && pending.opts.tone === 'danger';

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Destructive actions start on Cancel so Enter can never delete by accident.
    (danger ? cancelRef.current : primaryRef.current)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(false); return; }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [danger]);

  const titleId = `dialog-title-${pending.id}`;
  const messageId = `dialog-message-${pending.id}`;
  const title = pending.opts.title ?? (isConfirm ? 'Are you sure?' : 'Heads up');
  const eyebrow = isConfirm ? 'Please confirm' : 'Notice';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-[hsl(var(--foreground)/0.5)] backdrop-blur-[2px]" aria-hidden="true" onClick={() => onClose(false)} />
      <div
        ref={panelRef}
        role={isConfirm ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="reveal relative w-full max-w-[440px] border border-[hsl(var(--foreground))] bg-[hsl(var(--card))] p-7 text-[hsl(var(--card-foreground))] shadow-[8px_8px_0_hsl(var(--accent)/0.18)]"
      >
        <span className="mono text-[hsl(var(--accent))]">{eyebrow}</span>
        <h2 id={titleId} className="serif mt-3 text-3xl leading-tight">{title}</h2>
        <p id={messageId} className="mt-3 whitespace-pre-line text-sm leading-7 text-[hsl(var(--muted-foreground))]">{pending.opts.message}</p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          {pending.kind === 'confirm' ? (
            <>
              <button ref={cancelRef} type="button" className={cancelCls} onClick={() => onClose(false)}>{pending.opts.cancelLabel ?? 'Cancel'}</button>
              <button ref={primaryRef} type="button" className={danger ? dangerCls : confirmCls} onClick={() => onClose(true)}>{pending.opts.confirmLabel ?? 'Confirm'}</button>
            </>
          ) : (
            <button ref={primaryRef} type="button" className={confirmCls} onClick={() => onClose(true)}>{pending.opts.okLabel ?? 'OK'}</button>
          )}
        </div>
      </div>
    </div>
  );
}
