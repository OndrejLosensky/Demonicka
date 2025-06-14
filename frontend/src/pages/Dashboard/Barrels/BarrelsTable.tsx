import React from 'react';
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
  Typography,
  Chip,
  Box,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { Barrel } from '../../../types/barrel';
import { format } from 'date-fns';
import translations from '../../../locales/cs/dashboard.barrels.json';

interface BarrelTableProps {
  barrels: Barrel[];
  deletedBarrels: Barrel[];
  showDeleted: boolean;
  onDelete: (id: string) => Promise<void>;
}

export const BarrelsTable: React.FC<BarrelTableProps> = ({
  barrels,
  deletedBarrels,
  showDeleted,
  onDelete,
}) => {
  const allBarrels = showDeleted ? [...barrels, ...deletedBarrels] : barrels;

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{translations.table.columns.barrel}</TableCell>
            <TableCell>{translations.table.columns.size}</TableCell>
            <TableCell>{translations.table.columns.remainingBeers}</TableCell>
            <TableCell>{translations.table.columns.status}</TableCell>
            <TableCell>{translations.table.columns.createdAt}</TableCell>
            <TableCell align="right">{translations.table.columns.actions}</TableCell>
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
                    {`${barrel.brand} - ${barrel.id.slice(0, 8)}`}
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
                <Box sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 1,
                }}>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {barrel.size}L
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Box sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: barrel.beersLeft === 0 ? 'error.light' : 'success.light',
                  color: barrel.beersLeft === 0 ? 'error.main' : 'success.main',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 1,
                }}>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {barrel.beersLeft}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={translations.table.status[barrel.status === 'ACTIVE' ? 'active' : 'inactive']}
                  color={barrel.status === 'ACTIVE' ? 'success' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {format(new Date(barrel.createdAt), 'PPp')}
                </Typography>
              </TableCell>
              <TableCell align="right">
                {!barrel.deletedAt && (
                  <Tooltip title={translations.table.actions.delete}>
                    <IconButton
                      onClick={() => onDelete(barrel.id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 