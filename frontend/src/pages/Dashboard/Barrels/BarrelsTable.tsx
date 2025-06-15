import React from 'react';
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
  Button,
} from '@mui/material';
import type { Barrel } from '../../../types/barrel';
import translations from '../../../locales/cs/dashboard.barrels.json';

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
                    {`Sud ${barrel.orderNumber}`}
                  </Typography>
                  {showDeleted && barrel.deletedAt && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      {translations.table.status.deleted}
                    </Typography>
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
                <Box sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  bgcolor: barrel.isActive ? 'success.light' : 'grey.100',
                  color: barrel.isActive ? 'success.main' : 'text.secondary',
                  py: 0.5,
                  px: 1.5,
                  borderRadius: 1,
                }}>
                  <Typography sx={{ fontWeight: 'bold' }}>
                    {barrel.isActive ? translations.table.status.active : translations.table.status.inactive}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {new Date(barrel.createdAt).toLocaleDateString('cs-CZ')}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  {!barrel.isActive && barrel.remainingBeers > 0 && !barrel.deletedAt && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => onActivate(barrel.id)}
                    >
                      {translations.table.actions.activate}
                    </Button>
                  )}
                  {!barrel.deletedAt && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => onDelete(barrel.id)}
                    >
                      {translations.table.actions.delete}
                    </Button>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 