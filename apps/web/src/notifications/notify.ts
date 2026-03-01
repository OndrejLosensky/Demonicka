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
    padding: '12px 16px',
    gap: '12px',
  };

  return common;
}

function normalizeErrorMessage(err: unknown): string {
  // Axios shape: err.response?.data?.message (Nest sends string or string[] for validation)
  let msg: unknown;

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const response = e.response;
    if (typeof response === 'object' && response !== null) {
      const r = response as Record<string, unknown>;
      const data = r.data;
      if (typeof data === 'object' && data !== null) {
        const d = data as Record<string, unknown>;
        msg = d.message;
        if (Array.isArray(msg) && msg.length > 0) msg = msg[0];
      }
    }

    if (msg == null) msg = e.message;
  } else if (typeof err === 'string') {
    msg = err;
  }

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
      closeButton: true,
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
      closeButton: true,
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
      closeButton: true,
    });
  },
  error(message: string, opts?: NotifyOptions) {
    toast.error(message, {
      id: opts?.id,
      duration: opts?.duration ?? 4500,
      style: baseStyle('error'),
      closeButton: true,
    });
  },
  warning(message: string, opts?: NotifyOptions) {
    toast(message, {
      id: opts?.id,
      duration: opts?.duration ?? 4500,
      icon: '⚠️',
      style: baseStyle('warning'),
      closeButton: true,
    });
  },
  info(message: string, opts?: NotifyOptions) {
    toast(message, {
      id: opts?.id,
      duration: opts?.duration ?? 3500,
      icon: 'ℹ️',
      style: baseStyle('info'),
      closeButton: true,
    });
  },
  action,
  fromError: normalizeErrorMessage,
};

