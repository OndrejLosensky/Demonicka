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
  Typography
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

const getLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'error':
      return 'error';
    case 'warn':
      return 'warning';
    case 'info':
      return 'info';
    case 'debug':
      return 'default';
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
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="level-select-label">
            {translations.table.filters.logLevel.label}
          </InputLabel>
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

      <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Service</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.level.toUpperCase()}
                    size="small"
                    color={getLevelColor(log.level)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ 
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {log.message}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={log.service}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {translations.table.noData}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        labelRowsPerPage={translations.table.pagination.rowsPerPage}
      />
    </>
  );
}; 