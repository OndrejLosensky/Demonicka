import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocale } from '../../contexts/LocaleContext';

/**
 * When user is loaded and has preferredLocale, apply it to LocaleContext
 * (same behavior as theme: server preference wins when user is fetched).
 */
export function SyncUserLocale() {
  const { user } = useAuth();
  const { locale, setLocale } = useLocale();

  useEffect(() => {
    const preferred = user?.preferredLocale;
    if (preferred !== 'cs' && preferred !== 'en') return;
    if (preferred === locale) return;
    setLocale(preferred, { persistToServer: false });
  }, [user?.preferredLocale, locale, setLocale]);

  return null;
}
