import { toast } from 'react-hot-toast';

type NotifyKind = 'success' | 'error' | 'warning' | 'info';

export type NotifyOptions = {
  /**
   * Stable id = dedupe/replace existing toast (react-hot-toast behavior).
   * Use for spammy actions like add/remove beer.
   */
  id?: string;
  duration?: number;
};

function baseStyle(kind: NotifyKind): React.CSSProperties {
  // Theme-friendly defaults (CSS vars are defined in `src/index.css`)
  const common: React.CSSProperties = {
    background: 'var(--color-background-card)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border-primary)',
    borderLeftWidth: 6,
  };

  const accent =
    kind === 'success'
      ? 'oklch(0.72 0.22 145)' // green-ish
      : kind === 'warning'
        ? 'oklch(0.78 0.16 75)' // amber-ish
        : kind === 'info'
          ? 'oklch(0.72 0.18 240)' // blue-ish
          : 'oklch(0.62 0.22 25)'; // red-ish

  return { ...common, borderLeftColor: accent };
}

function normalizeErrorMessage(err: unknown): string {
  // Axios shape: err.response?.data?.message
  const anyErr = err as any;
  const msg =
    anyErr?.response?.data?.message ??
    anyErr?.message ??
    (typeof anyErr === 'string' ? anyErr : undefined);
  return typeof msg === 'string' && msg.trim().length ? msg : 'Něco se pokazilo';
}

async function action<T>(
  meta: { id?: string; success: string; error?: string | ((e: unknown) => string) },
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const result = await fn();
    toast.success(meta.success, {
      id: meta.id,
      duration: 3000,
      style: baseStyle('success'),
    });
    return result;
  } catch (e) {
    const message =
      typeof meta.error === 'function'
        ? meta.error(e)
        : typeof meta.error === 'string'
          ? meta.error
          : normalizeErrorMessage(e);

    toast.error(message, {
      id: meta.id,
      duration: 4500,
      style: baseStyle('error'),
    });
    throw e;
  }
}

export const notify = {
  success(message: string, opts?: NotifyOptions) {
    toast.success(message, {
      id: opts?.id,
      duration: opts?.duration ?? 3000,
      style: baseStyle('success'),
    });
  },
  error(message: string, opts?: NotifyOptions) {
    toast.error(message, {
      id: opts?.id,
      duration: opts?.duration ?? 4500,
      style: baseStyle('error'),
    });
  },
  warning(message: string, opts?: NotifyOptions) {
    toast(message, {
      id: opts?.id,
      duration: opts?.duration ?? 4500,
      icon: '⚠️',
      style: baseStyle('warning'),
    });
  },
  info(message: string, opts?: NotifyOptions) {
    toast(message, {
      id: opts?.id,
      duration: opts?.duration ?? 3500,
      icon: 'ℹ️',
      style: baseStyle('info'),
    });
  },
  action,
  fromError: normalizeErrorMessage,
};

