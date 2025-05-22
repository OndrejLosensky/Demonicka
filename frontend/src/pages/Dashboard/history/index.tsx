import React from 'react';
import { Box, Typography } from '@mui/material';
import { HistoryTable } from './HistoryTable';
import { useHistory } from './useHistory';

export const History = () => {
  const {
    logs,
    total,
    isLoading,
    page,
    rowsPerPage,
    level,
    handlePageChange,
    handleRowsPerPageChange,
    handleLevelChange,
  } = useHistory();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Action History
      </Typography>

      <HistoryTable
        logs={logs}
        total={total}
        isLoading={isLoading}
        page={page}
        rowsPerPage={rowsPerPage}
        level={level}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onLevelChange={handleLevelChange}
      />
    </Box>
  );
}; 