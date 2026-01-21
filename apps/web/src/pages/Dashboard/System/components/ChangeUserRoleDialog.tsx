import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import type { UserRole } from '@demonicka/shared-types';

type ChangeUserRoleDialogProps = {
  open: boolean;
  username?: string | null;
  currentRole: string | null;
  actorRole: UserRole | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (role: UserRole) => void;
  labels: {
    title: string;
    roleLabel: string;
    cancel: string;
    save: string;
    helperTextOperator: string;
  };
};

const ALL_ROLES: UserRole[] = ['SUPER_ADMIN', 'OPERATOR', 'USER', 'PARTICIPANT'];

export const ChangeUserRoleDialog: React.FC<ChangeUserRoleDialogProps> = ({
  open,
  username,
  currentRole,
  actorRole,
  isSaving,
  onClose,
  onSave,
  labels,
}) => {
  const [role, setRole] = useState<UserRole>('USER');

  useEffect(() => {
    if (!open) return;
    const initial = (currentRole as UserRole) || 'USER';
    setRole(initial);
  }, [open, currentRole]);

  const options = useMemo(() => {
    const isOperator = actorRole === 'OPERATOR';
    return ALL_ROLES.map((r) => ({
      value: r,
      disabled: isOperator && r === 'SUPER_ADMIN',
    }));
  }, [actorRole]);

  const title = username ? `${labels.title}: ${username}` : labels.title;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="user-role-label">{labels.roleLabel}</InputLabel>
          <Select
            labelId="user-role-label"
            label={labels.roleLabel}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isSaving}
          >
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {actorRole === 'OPERATOR' && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            {labels.helperTextOperator}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          {labels.cancel}
        </Button>
        <Button
          onClick={() => onSave(role)}
          variant="contained"
          disabled={isSaving}
        >
          {labels.save}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

