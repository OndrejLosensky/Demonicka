import React from 'react';
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
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useActivity } from './index.ts';

const Activity: React.FC = () => {
  usePageTitle('Aktivita');
  const {
    activityLogs,
    loading,
    page,
    rowsPerPage,
    totalCount,
    filterType,
    handleChangePage,
    handleChangeRowsPerPage,
    handleFilterChange,
    getActionIcon,
    getActionColor,
    formatActionText,
  } = useActivity();

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

export { Activity };