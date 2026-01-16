import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  PageHeader,
  type SelectChangeEvent,
} from '@demonicka/ui';
import { format } from 'date-fns';
import { api } from '../../../services/api';
import { usePageTitle } from '../../../hooks/usePageTitle';

interface ActivityLogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  event?: string;
  userId?: string;
  barrelId?: string;
  name?: string;
  gender?: string;
  oldCount?: number;
  newCount?: number;
  size?: number;
  isActive?: boolean;
  changes?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ActivityLogsResponse {
  logs: ActivityLogEntry[];
  total: number;
}

const ACTIVITY_EVENTS = ['BEER_ADDED', 'USER_CREATED', 'BEER_REMOVED'] as const;
type ActivityEventType = typeof ACTIVITY_EVENTS[number];

const getEventColor = (event: string) => {
  switch (event) {
    case 'BEER_ADDED':
      return 'success';
    case 'USER_CREATED':
      return 'primary';
    case 'BEER_REMOVED':
      return 'error';
    default:
      return 'default';
  }
};

const getEventLabel = (event: string) => {
  switch (event) {
    case 'BEER_ADDED':
      return 'Přidáno pivo';
    case 'USER_CREATED':
      return 'Přidán uživatel';
    case 'BEER_REMOVED':
      return 'Odebráno pivo';
    default:
      return event;
  }
};

const getEventMessage = (log: ActivityLogEntry) => {
  switch (log.event) {
    case 'BEER_ADDED':
      return `Přidáno pivo uživateli ${log.userId}`;
    case 'USER_CREATED':
      return `Vytvořen nový uživatel: ${log.name || 'Neznámý'} (${log.gender || 'Neznámé pohlaví'})`;
    case 'BEER_REMOVED':
      return `Odebráno pivo uživateli ${log.userId}`;
    default:
      return log.message;
  }
};

export const Activity: React.FC = () => {
  usePageTitle('Aktivita');
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [selectedEvent, setSelectedEvent] = useState<ActivityEventType | ''>('');

  const fetchActivityLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: rowsPerPage.toString(),
        offset: (page * rowsPerPage).toString(),
      });

      // Add event type filter if selected
      if (selectedEvent) {
        params.append('eventType', selectedEvent);
      }

      const response = await api.get<ActivityLogsResponse>(`/logs?${params}`);
      
      // Filter logs to only include activity events
      const filteredLogs = response.data.logs.filter((log: ActivityLogEntry) => 
        log.event && ACTIVITY_EVENTS.includes(log.event as ActivityEventType)
      );

      setLogs(filteredLogs);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, selectedEvent]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  const handlePageChange = (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEventChange = (event: SelectChangeEvent<string>) => {
    setSelectedEvent(event.target.value as ActivityEventType | '');
    setPage(0);
  };

  return (
    <Box>
      <PageHeader title="Aktivita" />

      <Paper sx={{ mb: 3, borderRadius: 2, p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="event-select-label">
              Typ události
            </InputLabel>
            <Select
              labelId="event-select-label"
              value={selectedEvent}
              label="Typ události"
              onChange={handleEventChange}
            >
              <MenuItem value="">Všechny události</MenuItem>
              {ACTIVITY_EVENTS.map((event) => (
                <MenuItem key={event} value={event}>
                  {getEventLabel(event)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2, overflowX: 'auto' }}>
        <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Čas</TableCell>
                <TableCell>Událost</TableCell>
                <TableCell>Zpráva</TableCell>
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
                      label={getEventLabel(log.event || '')}
                      size="small"
                      color={getEventColor(log.event || '')}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getEventMessage(log)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {isLoading ? 'Načítání...' : 'Žádná data k zobrazení'}
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
          onPageChange={handlePageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          labelRowsPerPage="Řádků na stránku"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
        />
      </Paper>
    </Box>
  );
}; 