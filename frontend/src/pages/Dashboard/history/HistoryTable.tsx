import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { format } from 'date-fns';
import type { LogEntry } from './types';
import { LOG_LEVELS } from './useHistory';
import type { LogLevel } from './useHistory';
import translations from '../../../locales/cs/dashboard.history.json';

interface HistoryTableProps {
  logs: LogEntry[];
  total: number;
  isLoading: boolean;
  page: number;
  rowsPerPage: number;
  level: LogLevel | '';
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLevelChange: (level: LogLevel | '') => void;
}

const getLogLevelColor = (level: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (level.toLowerCase()) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

const formatLogEntry = (log: LogEntry) => {
  const { timestamp, level, message, event, ...rest } = log;
  const metadata: Record<string, unknown> = { ...rest };
  delete metadata.service;

  return {
    timestamp: format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss'),
    level,
    message,
    event,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
  };
};

export const HistoryTable: React.FC<HistoryTableProps> = ({
  logs,
  total,
  isLoading,
  page,
  rowsPerPage,
  level,
  onPageChange,
  onRowsPerPageChange,
  onLevelChange,
}) => {
  const handleLevelChange = (event: SelectChangeEvent<string>) => {
    onLevelChange(event.target.value as LogLevel | '');
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="level-select-label">{translations.table.filters.logLevel.label}</InputLabel>
          <Select
            labelId="level-select-label"
            value={level}
            label={translations.table.filters.logLevel.label}
            onChange={handleLevelChange}
          >
            <MenuItem value="">{translations.table.filters.logLevel.all}</MenuItem>
            {LOG_LEVELS.map((lvl) => (
              <MenuItem key={lvl} value={lvl}>
                {lvl.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{translations.table.columns.timestamp}</TableCell>
              <TableCell>{translations.table.columns.level}</TableCell>
              <TableCell>{translations.table.columns.event}</TableCell>
              <TableCell>{translations.table.columns.message}</TableCell>
              <TableCell>{translations.table.columns.metadata}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              logs.map((log, index) => {
                const { timestamp, level, message, event, metadata } =
                  formatLogEntry(log);
                return (
                  <TableRow key={index}>
                    <TableCell>{timestamp}</TableCell>
                    <TableCell>
                      <Chip
                        label={level.toUpperCase()}
                        color={getLogLevelColor(level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {event && (
                        <Chip label={event} variant="outlined" size="small" />
                      )}
                    </TableCell>
                    <TableCell>{message}</TableCell>
                    <TableCell>
                      {metadata && (
                        <pre style={{ margin: 0 }}>
                          {JSON.stringify(metadata, null, 2)}
                        </pre>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={total}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage={translations.table.pagination.rowsPerPage}
      />
    </>
  );
}; 