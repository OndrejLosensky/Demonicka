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
import { useTranslations } from '../../../contexts/LocaleContext';
import { tokens } from '../../../theme/tokens';

interface HistoryTableProps {
  logs: LogEntry[];
  total: number;
  isLoading: boolean;
  page: number;
  rowsPerPage: number;
  level: LogLevel | '';
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLevelChange: (level: LogLevel | '') => void;
}

const getLevelColor = (level: string): "error" | "warning" | "info" | "default" => {
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

export const HistoryTable: React.FC<HistoryTableProps> = ({
  logs,
  total,
  page,
  rowsPerPage,
  level,
  onPageChange,
  onRowsPerPageChange,
  onLevelChange,
}) => {
  const t = useTranslations<Record<string, unknown>>('dashboard.history');
  const table = (t.table as Record<string, unknown>) || {};
  const columns = (table.columns as Record<string, string>) || {};
  const filters = (table.filters as Record<string, Record<string, string>>) || {};
  const logLevelFilter = filters.logLevel || {};
  const pagination = (table.pagination as Record<string, string>) || {};
  const handleLevelChange = (event: SelectChangeEvent<string>) => {
    onLevelChange(event.target.value as LogLevel | '');
  };

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="level-select-label">
            {logLevelFilter.label ?? 'Úroveň logu'}
          </InputLabel>
          <Select
            labelId="level-select-label"
            value={level}
            label={logLevelFilter.label ?? 'Úroveň logu'}
            onChange={handleLevelChange}
          >
            <MenuItem value="">{logLevelFilter.all ?? 'Vše'}</MenuItem>
            {LOG_LEVELS.map((lvl) => (
              <MenuItem key={lvl} value={lvl}>
                {lvl.toUpperCase()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: tokens.borderRadius.md, mb: 2, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>{columns.timestamp ?? 'Časová značka'}</TableCell>
              <TableCell>{columns.level ?? 'Úroveň'}</TableCell>
              <TableCell>{columns.message ?? 'Zpráva'}</TableCell>
              <TableCell>Service</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow key={`log-${index}-${log.timestamp}`} hover>
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
                    No data available
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
        labelRowsPerPage={pagination.rowsPerPage ?? 'Řádků na stránku'}
      />
    </>
  );
}; 