import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  PowerSettingsNew as PowerIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import type { Barrel } from '../../../types/barrel';
import translations from '../../../locales/cs/dashboard.barrels.json';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface BarrelTableProps {
  barrels: Barrel[];
  deletedBarrels: Barrel[];
  showDeleted: boolean;
  onDelete: (id: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
}

export const BarrelsTable: React.FC<BarrelTableProps> = ({
  barrels,
  deletedBarrels,
  showDeleted,
  onDelete,
  onActivate,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<null | { element: HTMLElement; barrel: { id: string; size: number } }>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBarrel, setSelectedBarrel] = useState<{ id: string; size: number } | null>(null);

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleDeleteClick = () => {
    if (menuAnchor?.barrel) {
      setSelectedBarrel(menuAnchor.barrel);
    }
    handleCloseMenu();
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedBarrel) {
      onDelete(selectedBarrel.id);
    }
    setDeleteDialogOpen(false);
    setSelectedBarrel(null);
  };

  const allBarrels = showDeleted ? [...barrels, ...deletedBarrels] : barrels;

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{translations.table.columns.barrel}</TableCell>
              <TableCell>{translations.table.columns.size}</TableCell>
              <TableCell>{translations.table.columns.remainingBeers}</TableCell>
              <TableCell>{translations.table.columns.status}</TableCell>
              <TableCell>{translations.table.columns.createdAt}</TableCell>
              <TableCell align="right" sx={{ width: 220 }}>{translations.table.columns.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allBarrels.map((barrel) => (
              <TableRow
                key={barrel.id}
                sx={{
                  opacity: barrel.deletedAt ? 0.5 : 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 500 }}>
                      {`#${barrel.orderNumber}`}
                    </Typography>
                    {showDeleted && barrel.deletedAt && (
                      <Chip
                        label={translations.table.status.deleted}
                        color="error"
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FaBeer style={{ color: 'rgba(0, 0, 0, 0.6)', fontSize: '1rem' }} />
                    <Typography>{barrel.size}L</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(barrel.remainingBeers / barrel.totalBeers) * 100}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: barrel.remainingBeers === 0 ? 'error.main' : 'success.main',
                          }
                        }}
                      />
                    </Box>
                    <Typography sx={{ 
                      minWidth: 80,
                      fontWeight: 'bold',
                      color: barrel.remainingBeers === 0 ? 'error.main' : 'success.main'
                    }}>
                      {barrel.remainingBeers} / {barrel.totalBeers}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={barrel.isActive ? translations.table.status.active : translations.table.status.inactive}
                    size="small"
                    sx={{
                      bgcolor: barrel.isActive ? 'success.light' : 'grey.100',
                      color: barrel.isActive ? 'success.main' : 'text.secondary',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(barrel.createdAt).toLocaleDateString('cs-CZ')}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  {!barrel.deletedAt && (
                    <>
                      {!barrel.isActive && barrel.remainingBeers > 0 && (
                        <Tooltip title={translations.table.actions.activate}>
                          <IconButton
                            size="small"
                            onClick={() => onActivate(barrel.id)}
                            sx={{
                              mr: 1,
                              border: 1,
                              borderColor: 'primary.main',
                              '&:hover': {
                                bgcolor: 'primary.light',
                              },
                            }}
                          >
                            <PowerIcon fontSize="small" color="primary" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={translations.table.actions.delete}>
                        <IconButton
                          size="small"
                          onClick={(e) => setMenuAnchor({ 
                            element: e.currentTarget, 
                            barrel: { 
                              id: barrel.id, 
                              size: barrel.size 
                            } 
                          })}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>{translations.table.actions.delete}</ListItemText>
        </MenuItem>
      </Menu>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        barrelSize={selectedBarrel?.size || 0}
      />
    </>
  );
}; 