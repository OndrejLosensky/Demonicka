/**
 * Format a date string to localized date
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Format a date string to localized time
 */
export function formatTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Format a date string to localized date and time
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('cs-CZ', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Format date and time for lists (full locale string)
 */
export function formatDateTimeLong(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('cs-CZ');
  } catch {
    return '-';
  }
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'právě teď';
    if (diffMin < 60) return `před ${diffMin} min`;
    if (diffHour < 24) return `před ${diffHour} h`;
    if (diffDay < 7) return `před ${diffDay} dny`;

    return formatDate(dateString);
  } catch {
    return '-';
  }
}

/**
 * Format a number with Czech locale
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString('cs-CZ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format litres with unit
 */
export function formatLitres(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${formatNumber(value, 1)} l`;
}
