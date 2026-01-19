import { useEffect, useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Box, Card, PageLoader, Typography } from '@demonicka/ui';
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { userSettingsService } from '../../../services/userSettingsService';

export function UserSettingsPage() {
  const { user } = useAuth();
  const { username } = useParams<{ username: string }>();
  const { mode, setMode } = useAppTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [preferredTheme, setPreferredTheme] = useState<PaletteMode>('dark');
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
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, mode]);

  if (!user) return <Navigate to="/login" replace />;
  if (username && username !== user.username) return <Navigate to={canonicalPath} replace />;
  if (isLoading) return <PageLoader message="Načítání nastavení..." />;

  const save = async () => {
    setIsSaving(true);
    try {
      // Apply immediately + persist to server
      setMode(preferredTheme, { persistToServer: true });
      await userSettingsService.updateMySettings(preferredTheme);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Nastavení
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Přizpůsobte si vzhled aplikace
        </Typography>
      </Card>

      <Card>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          Preferovaný motiv
        </Typography>
        <FormControl fullWidth>
          <InputLabel id="preferred-theme-label">Motiv</InputLabel>
          <Select
            labelId="preferred-theme-label"
            label="Motiv"
            value={preferredTheme}
            onChange={(e) => setPreferredTheme(e.target.value as PaletteMode)}
          >
            <MenuItem value="dark">Tmavý</MenuItem>
            <MenuItem value="light">Světlý</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button variant="contained" onClick={save} disabled={isSaving}>
            {isSaving ? 'Ukládám...' : 'Uložit'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}

