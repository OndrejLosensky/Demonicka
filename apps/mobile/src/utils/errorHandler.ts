import type { ApiError } from '../services/api';

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  isNetworkError?: boolean;
  isAuthError?: boolean;
}

/**
 * Parse and normalize errors from various sources
 */
export function parseError(error: unknown): AppError {
  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('Network')) {
    return {
      message: 'Připojení k serveru selhalo. Zkontrolujte internetové připojení.',
      isNetworkError: true,
    };
  }

  // Handle AbortError (timeout)
  if (error instanceof DOMException && error.name === 'AbortError') {
    return {
      message: 'Požadavek vypršel. Zkuste to prosím znovu.',
      code: 'TIMEOUT',
    };
  }

  // Handle API errors
  if (isApiError(error)) {
    const status = error.status;

    if (status === 401) {
      return {
        message: 'Přihlášení vypršelo. Přihlaste se prosím znovu.',
        status,
        isAuthError: true,
      };
    }

    if (status === 403) {
      return {
        message: 'Nemáte oprávnění k této akci.',
        status,
      };
    }

    if (status === 404) {
      return {
        message: 'Požadovaná položka nebyla nalezena.',
        status,
      };
    }

    if (status && status >= 500) {
      return {
        message: 'Chyba serveru. Zkuste to prosím později.',
        status,
      };
    }

    return {
      message: error.message || 'Něco se pokazilo.',
      status,
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      message: error.message || 'Něco se pokazilo.',
    };
  }

  // Handle unknown errors
  return {
    message: 'Neočekávaná chyba. Zkuste to prosím znovu.',
  };
}

/**
 * Type guard for API errors
 */
function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    ('status' in error || 'data' in error)
  );
}

/**
 * Log error for debugging (can be extended for remote logging)
 */
export function logError(error: unknown, context?: string): void {
  const parsed = parseError(error);
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
    message: parsed.message,
    status: parsed.status,
    original: error,
  });
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  return parseError(error).message;
}
