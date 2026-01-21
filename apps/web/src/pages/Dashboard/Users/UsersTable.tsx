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
import translations from '../../../locales/cs/dashboard.users.json';
import { tokens } from '../../../theme/tokens';

export const UsersTable: React.FC<UserTableProps> = ({
  users,
  onAddBeer,
  onRemoveBeer,
  onDelete,
  showGender = true,
}) => {
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
              <TableCell className="font-bold">{translations.table.columns.name}</TableCell>
              <TableCell align="center" className="font-bold">{translations.table.columns.beers}</TableCell>
              {showGender && <TableCell className="font-bold">{translations.table.columns.gender}</TableCell>}
              <TableCell className="font-bold">{translations.table.columns.lastBeer}</TableCell>
              <TableCell align="right" className="font-bold w-[220px]">{translations.table.columns.actions}</TableCell>
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
                    {user.gender === 'MALE' ? translations.dialogs.add.genders.male : translations.dialogs.add.genders.female}
                  </TableCell>
                )}
                <TableCell>
                  {user.lastBeerTime ? format(new Date(user.lastBeerTime), 'dd.MM.yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={translations.actions.addBeer}>
                    <IconButton onClick={() => onAddBeer(user.id)} size="small">
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                  {user.beerCount > 0 && (
                    <Tooltip title={translations.actions.removeBeer}>
                      <IconButton onClick={() => onRemoveBeer(user.id)} size="small">
                        <RemoveIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={translations.actions.delete}>
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
          <ListItemText>{translations.actions.delete}</ListItemText>
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