import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Box,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import type { UserTableProps } from './types';
import { format } from 'date-fns';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { useTranslations } from '../../../contexts/LocaleContext';
import { tokens } from '../../../theme/tokens';

export const UsersTable: React.FC<UserTableProps> = ({
  users,
  onAddBeer,
  onRemoveBeer,
  onDelete,
  showGender = true,
}) => {
  const t = useTranslations<Record<string, unknown>>('dashboard.users');
  const table = (t.table as Record<string, Record<string, string>>) || {};
  const columns = table.columns || {};
  const actions = (t.actions as Record<string, string>) || {};
  const dialogsAdd = (t.dialogs as Record<string, Record<string, unknown>>)?.add as Record<string, Record<string, string>> | undefined;
  const genders = dialogsAdd?.genders || {};
  const [menuAnchor, setMenuAnchor] = useState<null | { element: HTMLElement; user: { id: string; name: string } }>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDeleteClick = () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (menuAnchor) {
      onDelete(menuAnchor.user.id);
    }
    setDeleteDialogOpen(false);
    setMenuAnchor(null);
  };

  return (
    <>
      <TableContainer component={Paper} className="shadow-lg" sx={{ borderRadius: 1, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell className="font-bold">{columns.name}</TableCell>
              <TableCell align="center" className="font-bold">{columns.beers}</TableCell>
              {showGender && <TableCell className="font-bold">{columns.gender}</TableCell>}
              <TableCell className="font-bold">{columns.lastBeer}</TableCell>
              <TableCell align="right" className="font-bold w-[220px]">{columns.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ mr: 2 }}>
                      {user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography>{user.username}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{user.beerCount}</TableCell>
                {showGender && (
                  <TableCell>
                    {user.gender === 'MALE' ? genders.male : genders.female}
                  </TableCell>
                )}
                <TableCell>
                  {user.lastBeerTime ? format(new Date(user.lastBeerTime), 'dd.MM.yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={actions.addBeer}>
                    <IconButton onClick={() => onAddBeer(user.id)} size="small">
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  {user.beerCount > 0 && (
                    <Tooltip title={actions.removeBeer}>
                      <IconButton onClick={() => onRemoveBeer(user.id)} size="small">
                        <RemoveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={actions.delete}>
                    <IconButton
                      onClick={(event) => setMenuAnchor({ element: event.currentTarget, user: { id: user.id, name: user.name } })}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{actions.delete}</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        userName={menuAnchor?.user.name || ''}
      />
    </>
  );
}; 