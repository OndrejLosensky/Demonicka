import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Box, Card, PageLoader, Typography } from '@demonicka/ui';
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { useLocale, useTranslations } from '../../../contexts/LocaleContext';
import type { AppLocale } from '../../../contexts/LocaleContext';
import { userSettingsService } from '../../../services/userSettingsService';

interface SettingsTranslations {
  title: string;
  subtitle: string;
  theme: { label: string; selectLabel: string; dark: string; light: string };
  language: { label: string; selectLabel: string; cs: string; en: string };
  save: string;
  saving: string;
  loading: string;
}

export function UserSettingsPage() {
  const { user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const { mode, setMode } = useAppTheme();
  const { locale, setLocale } = useLocale();
  const t = useTranslations<SettingsTranslations>('settings');

  const [isLoading, setIsLoading] = useState(true);
  const [preferredTheme, setPreferredTheme] = useState<PaletteMode>('dark');
  const [preferredLocale, setPreferredLocale] = useState<AppLocale>('cs');
  const [isSaving, setIsSaving] = useState(false);

  const canonicalPath = useMemo(() => {
    if (!user) return '/login';
    return `/u/${encodeURIComponent(user.username)}/settings`;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      try {
        setIsLoading(true);
        const s = await userSettingsService.getMySettings();
        if (cancelled) return;
        if (s.preferredTheme === 'light' || s.preferredTheme === 'dark') {
          setPreferredTheme(s.preferredTheme);
        } else {
          setPreferredTheme(mode);
        }
        if (s.preferredLocale === 'cs' || s.preferredLocale === 'en') {
          setPreferredLocale(s.preferredLocale);
        } else {
          setPreferredLocale(locale);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, mode, locale]);

  if (!user) return <Navigate to="/login" replace />;
  if (username && username !== user.username) return <Navigate to={canonicalPath} replace />;
  if (isLoading) return <PageLoader message={t.loading || 'Loading...'} />;

  const save = async () => {
    setIsSaving(true);
    try {
      setMode(preferredTheme, { persistToServer: true });
      setLocale(preferredLocale, { persistToServer: true });
      await userSettingsService.updateMySettings({
        preferredTheme,
        preferredLocale,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {t.title || 'Nastavení'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t.subtitle}
        </Typography>
      </Card>

      <Card>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t.theme?.label}
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="preferred-theme-label">{t.theme?.selectLabel}</InputLabel>
          <Select
            labelId="preferred-theme-label"
            label={t.theme?.selectLabel}
            value={preferredTheme}
            onChange={(e) => setPreferredTheme(e.target.value as PaletteMode)}
          >
            <MenuItem value="dark">{t.theme?.dark}</MenuItem>
            <MenuItem value="light">{t.theme?.light}</MenuItem>
          </Select>
        </FormControl>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t.language?.label}
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="preferred-locale-label">{t.language?.selectLabel}</InputLabel>
          <Select
            labelId="preferred-locale-label"
            label={t.language?.selectLabel}
            value={preferredLocale}
            onChange={(e) => setPreferredLocale(e.target.value as AppLocale)}
          >
            <MenuItem value="cs">{t.language?.cs}</MenuItem>
            <MenuItem value="en">{t.language?.en}</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" onClick={save} disabled={isSaving}>
            {isSaving ? (t.saving || 'Ukládám...') : (t.save || 'Uložit')}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
