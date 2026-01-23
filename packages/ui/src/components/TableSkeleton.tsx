import React from 'react';
import { Box, Skeleton } from '../mui/components.js';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '../mui/components.js';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 8,
  columns = 6,
  showHeader = true,
}) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 1, overflowX: 'auto' }}>
      <Table size="small">
        {showHeader && (
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, idx) => (
                <TableCell key={idx}>
                  <Skeleton variant="text" width="60%" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  {colIdx === 0 ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="text" width={100} />
                    </Box>
                  ) : (
                    <Skeleton variant="text" width={colIdx === columns - 1 ? '40%' : '70%'} />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
