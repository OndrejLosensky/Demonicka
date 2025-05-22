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
  Switch,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { BarrelTableProps } from './types';
import { format } from 'date-fns';

export const BarrelsTable: React.FC<BarrelTableProps> = ({
  barrels,
  onDelete,
  onToggleActive,
}) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Size (L)</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {barrels.map((barrel) => (
            <TableRow key={barrel.id}>
              <TableCell>{barrel.size}L</TableCell>
              <TableCell>
                <Switch
                  checked={barrel.isActive}
                  onChange={(e) => onToggleActive(barrel.id, e.target.checked)}
                  color="primary"
                />
              </TableCell>
              <TableCell>
                {format(new Date(barrel.createdAt), 'PPp')}
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Delete Barrel">
                  <IconButton
                    color="error"
                    onClick={() => onDelete(barrel.id)}
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
  );
}; 