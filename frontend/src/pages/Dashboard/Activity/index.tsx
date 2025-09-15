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
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageHeader } from '../../../components/ui/PageHeader';
import { activityService } from '../../../services/activityService';
import type { ActivityLog } from '../../../types/activity';

export const Activity: React.FC = () => {
  usePageTitle('Aktivita');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');

  const loadActivityLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await activityService.getActivityLogs({
        page,
        limit: rowsPerPage,
        type: filterType === 'all' ? undefined : filterType,
      });
      
      setActivityLogs(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, rowsPerPage, filterType]);

  useEffect(() => {
    loadActivityLogs();
  }, [loadActivityLogs]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilterType(event.target.value);
    setPage(0);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return '🔐';
      case 'USER_LOGOUT':
        return '🚪';
      case 'BEER_ADDED':
        return '🍺';
      case 'BARREL_ADDED':
        return '🛢️';
      case 'BARREL_FINISHED':
        return '✅';
      case 'USER_CREATED':
        return '👤';
      case 'EVENT_CREATED':
        return '📅';
      case 'EVENT_ACTIVATED':
        return '▶️';
      case 'EVENT_DEACTIVATED':
        return '⏸️';
      default:
        return '📝';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'USER_LOGIN':
        return 'success';
      case 'USER_LOGOUT':
        return 'default';
      case 'BEER_ADDED':
        return 'primary';
      case 'BARREL_ADDED':
        return 'warning';
      case 'BARREL_FINISHED':
        return 'success';
      case 'USER_CREATED':
        return 'info';
      case 'EVENT_CREATED':
        return 'secondary';
      case 'EVENT_ACTIVATED':
        return 'success';
      case 'EVENT_DEACTIVATED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatActionText = (log: ActivityLog) => {
    switch (log.action) {
      case 'USER_LOGIN':
        return `${log.userName} se přihlásil`;
      case 'USER_LOGOUT':
        return `${log.userName} se odhlásil`;
      case 'BEER_ADDED':
        return `${log.userName} přidal pivo`;
      case 'BARREL_ADDED':
        return `${log.userName} přidal sud`;
      case 'BARREL_FINISHED':
        return `${log.userName} dokončil sud`;
      case 'USER_CREATED':
        return `${log.userName} vytvořil uživatele`;
      case 'EVENT_CREATED':
        return `${log.userName} vytvořil událost`;
      case 'EVENT_ACTIVATED':
        return `${log.userName} aktivoval událost`;
      case 'EVENT_DEACTIVATED':
        return `${log.userName} deaktivoval událost`;
      default:
        return `${log.userName} provedl akci: ${log.action}`;
    }
  };

  return (
    <Box>
      <PageHeader
        title="Aktivita"
        action={
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filtr</InputLabel>
            <Select
              value={filterType}
              label="Filtr"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">Všechny akce</MenuItem>
              <MenuItem value="USER_LOGIN">Přihlášení</MenuItem>
              <MenuItem value="USER_LOGOUT">Odhlášení</MenuItem>
              <MenuItem value="BEER_ADDED">Přidání piva</MenuItem>
              <MenuItem value="BARREL_ADDED">Přidání sudu</MenuItem>
              <MenuItem value="BARREL_FINISHED">Dokončení sudu</MenuItem>
              <MenuItem value="USER_CREATED">Vytvoření uživatele</MenuItem>
              <MenuItem value="EVENT_CREATED">Vytvoření události</MenuItem>
              <MenuItem value="EVENT_ACTIVATED">Aktivace události</MenuItem>
              <MenuItem value="EVENT_DEACTIVATED">Deaktivace události</MenuItem>
            </Select>
          </FormControl>
        }
      />

      <Paper sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Čas</TableCell>
                <TableCell>Akce</TableCell>
                <TableCell>Uživatel</TableCell>
                <TableCell>IP Adresa</TableCell>
                <TableCell>User Agent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography>Načítání...</Typography>
                  </TableCell>
                </TableRow>
              ) : activityLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">
                      Žádné záznamy aktivity
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                activityLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss', { locale: cs })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontSize: '1.2em' }}>
                          {getActionIcon(log.action)}
                        </Typography>
                        <Chip
                          label={formatActionText(log)}
                          size="small"
                          color={getActionColor(log.action) as any}
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {log.userName || 'Neznámý uživatel'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {log.ipAddress || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                        title={log.userAgent || ''}
                      >
                        {log.userAgent || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Řádků na stránku:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} z ${count !== -1 ? count : `více než ${to}`}`
          }
        />
      </Paper>
    </Box>
  );
};
