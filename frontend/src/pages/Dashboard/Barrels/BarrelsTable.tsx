import React, { useState } from 'react';
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
  Chip,
  Switch,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import { 
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { GiBarrel } from 'react-icons/gi';
import type { BarrelTableProps } from './types';
import { format } from 'date-fns';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import translations from '../../../locales/cs/dashboard.barrels.json';

export const BarrelsTable: React.FC<BarrelTableProps> = ({
  barrels,
  onDelete,
  onToggleActive,
  showDeletedStatus = false,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | { element: HTMLElement; barrel: { id: string; size: number } }>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, barrel: { id: string; size: number }) => {
    setMenuAnchor({ element: event.currentTarget, barrel });
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDeleteClick = () => {
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (menuAnchor) {
      onDelete(menuAnchor.barrel.id);
    }
    setDeleteDialogOpen(false);
    setMenuAnchor(null);
  };

  const getBarrelSizeIcon = (size: number) => {
    const iconClass = size === 50 ? 'text-3xl' : size === 30 ? 'text-2xl' : 'text-xl';
    return <GiBarrel className={`${iconClass} ${size === 50 ? 'text-primary' : size === 30 ? 'text-primary/80' : 'text-primary/60'}`} />;
  };

  const getProgressColor = (remainingBeers: number, totalBeers: number) => {
    const percentage = (remainingBeers / totalBeers) * 100;
    if (percentage > 66) return 'success';
    if (percentage > 33) return 'warning';
    return 'error';
  };

  return (
    <>
      <TableContainer component={Paper} className="shadow-lg rounded-xl overflow-hidden">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="font-bold">{translations.table.columns.barrel}</TableCell>
              <TableCell className="font-bold">{translations.table.columns.size}</TableCell>
              <TableCell className="font-bold">{translations.table.columns.remainingBeers}</TableCell>
              <TableCell className="font-bold">{translations.table.columns.status}</TableCell>
              <TableCell className="font-bold">{translations.table.columns.createdAt}</TableCell>
              <TableCell align="right" className="font-bold w-[100px]">{translations.table.columns.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {barrels.map((barrel) => {
              const totalBeers = barrel.size * 2;
              return (
                <TableRow 
                  key={barrel.id}
                  className="hover:bg-primary/5 transition-colors"
                  sx={{
                    opacity: barrel.deletedAt ? 0.5 : 1,
                  }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getBarrelSizeIcon(barrel.size)}
                      <Typography className="font-medium">#{barrel.orderNumber}</Typography>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Typography className="font-medium">{barrel.size}L</Typography>
                      {showDeletedStatus && barrel.deletedAt && (
                        <Chip
                          label={translations.table.status.deleted}
                          color="error"
                          size="small"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Typography className="text-sm font-medium">
                          {barrel.remainingBeers} / {totalBeers} beers
                        </Typography>
                        <Typography className="text-xs text-text-secondary">
                          {Math.round((barrel.remainingBeers / totalBeers) * 100)}%
                        </Typography>
                      </div>
                      <LinearProgress 
                        variant="determinate" 
                        value={(barrel.remainingBeers / totalBeers) * 100}
                        color={getProgressColor(barrel.remainingBeers, totalBeers)}
                        className="rounded-full"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={barrel.isActive}
                        onChange={() => !barrel.deletedAt && onToggleActive && onToggleActive(barrel.id)}
                        disabled={!!barrel.deletedAt || !onToggleActive}
                        color="primary"
                        size="small"
                        className="mr-2"
                      />
                      <Typography 
                        className={`text-sm font-medium ${barrel.isActive ? 'text-green-600' : 'text-gray-500'}`}
                      >
                        {barrel.isActive ? translations.table.status.active : translations.table.status.inactive}
                      </Typography>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" className="text-text-secondary">
                      {format(new Date(barrel.createdAt), 'PPp')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {!barrel.deletedAt && (
                      <Tooltip title={translations.dialogs.delete.title}>
                        <IconButton
                          onClick={(e) => handleOpenMenu(e, { id: barrel.id, size: barrel.size })}
                          size="medium"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleDeleteClick} className="text-red-500">
          <ListItemIcon>
            <DeleteIcon fontSize="small" className="text-red-500" />
          </ListItemIcon>
          <ListItemText>{translations.dialogs.delete.title}</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        barrelSize={menuAnchor?.barrel.size || 0}
      />
    </>
  );
}; 