import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  Divider,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { participantsApi } from './api';
import { eventService } from '../../../services/eventService';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { notify } from '../../../notifications/notify';
import type { Participant } from './types';

interface ImportParticipantsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ImportParticipantsDialog: React.FC<ImportParticipantsDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { activeEvent } = useActiveEvent();
  const [allUsers, setAllUsers] = useState<Participant[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!open || !activeEvent?.id) return;
    setSearch('');
    setSelected(new Set());
    setIsLoading(true);

    Promise.all([
      participantsApi.getAll(),
      participantsApi.getByEvent(activeEvent.id),
    ])
      .then(([all, enrolled]) => {
        const enrolledIds = new Set(enrolled.map((u) => u.id));
        setAllUsers(all.filter((u) => !enrolledIds.has(u.id)));
      })
      .catch(() => {
        notify.error('Nepodařilo se načíst uživatele.');
      })
      .finally(() => setIsLoading(false));
  }, [open, activeEvent?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.name?.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (!activeEvent?.id || selected.size === 0) return;
    setIsImporting(true);
    try {
      await notify.action(
        {
          success: `Přidáno ${selected.size} uživatel${selected.size === 1 ? '' : selected.size < 5 ? 'é' : 'ů'}`,
          error: (err) => notify.fromError(err) ?? 'Nepodařilo se přidat uživatele',
        },
        () =>
          Promise.all(
            Array.from(selected).map((userId) =>
              eventService.addUser(activeEvent.id, userId),
            ),
          ),
      );
      onSuccess();
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Přidat existující uživatele</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Hledat uživatele…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              {search
                ? 'Žádný uživatel neodpovídá hledání.'
                : 'Všichni uživatelé jsou již v události.'}
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filtered.map((user, idx) => {
              const isSelected = selected.has(user.id);
              const label = user.name || user.username;
              const initials = label?.charAt(0).toUpperCase() ?? '?';
              return (
                <React.Fragment key={user.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItemButton onClick={() => toggleSelect(user.id)} selected={isSelected}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 36, height: 36, fontSize: 15, bgcolor: 'error.main' }}>
                        {initials}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={label}
                      secondary={user.name ? `@${user.username}` : undefined}
                    />
                    <Checkbox
                      edge="end"
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                      color="error"
                    />
                  </ListItemButton>
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          {selected.size > 0 ? `Vybráno: ${selected.size}` : 'Nic nevybráno'}
        </Typography>
        <Box display="flex" gap={1}>
          <Button onClick={onClose} disabled={isImporting}>
            Zrušit
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={selected.size === 0 || isImporting}
            onClick={handleImport}
            startIcon={isImporting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {selected.size > 0 ? `Přidat (${selected.size})` : 'Přidat'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};
