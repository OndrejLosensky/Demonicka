import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import { loadAllTranslations } from '../translations/load';

export type AppLocale = 'cs' | 'en';

const STORAGE_KEY = 'app_locale';

type TranslationsMap = {
  cs: Record<string, Record<string, unknown>>;
  en: Record<string, Record<string, unknown>>;
};

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (next: AppLocale, opts?: { persistToServer?: boolean }) => void;
  translationsMap: TranslationsMap | null;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('cs');
  const [translationsMap, setTranslationsMap] = useState<TranslationsMap | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'cs' || stored === 'en') setLocaleState(stored);
  }, []);

  useEffect(() => {
    loadAllTranslations().then(setTranslationsMap);
  }, []);

  const setLocale = useCallback(
    (next: AppLocale, opts?: { persistToServer?: boolean }) => {
      setLocaleState(next);
      localStorage.setItem(STORAGE_KEY, next);

      const shouldPersist = opts?.persistToServer ?? false;
      const token = localStorage.getItem('access_token');
      if (shouldPersist && token) {
        void api
          .patch('/users/me/settings', { preferredLocale: next })
          .catch(() => {});
      }
    },
    [],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, translationsMap }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

/** Returns translations for the given namespace (e.g. 'common', 'common.header'). Falls back to cs if en is missing. */
export function useTranslations<T = Record<string, unknown>>(namespace: string): T {
  const { locale, translationsMap } = useLocale();
  if (!translationsMap) return {} as T;
  const forLocale = translationsMap[locale]?.[namespace];
  const forCs = translationsMap.cs?.[namespace];
  return ((forLocale ?? forCs ?? {}) as T);
}
