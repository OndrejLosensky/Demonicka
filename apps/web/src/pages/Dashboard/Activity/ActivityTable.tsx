import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@demonicka/ui';
import { format } from 'date-fns';
import type { ActivityLogEntry } from './activity.types';
import { getActivityEventColor, getActivityEventLabel, getActivityEventMessage, getAppLabel, getLevelLabel, getLevelColor } from './activity.presentation';

export function ActivityTable({
  logs,
  isLoading,
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
}: {
  logs: ActivityLogEntry[];
  isLoading: boolean;
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (_: unknown, newPage: number) => void;
  onRowsPerPageChange: (value: number) => void;
  onRowClick: (log: ActivityLogEntry) => void;
}) {
  return (
    <Box>
      <TableContainer
        component={Paper}
        sx={{ borderRadius: 1, mb: 2, overflowX: 'auto' }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Čas</TableCell>
              <TableCell>Zdroj</TableCell>
              <TableCell>Úroveň</TableCell>
              <TableCell>Událost</TableCell>
              <TableCell>Zpráva</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log, index) => (
              <TableRow
                key={`log-${index}-${log.timestamp}`}
                hover
                onClick={() => onRowClick(log)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {format(new Date(log.timestamp), 'dd.MM.yyyy HH:mm:ss')}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getAppLabel(log.app ?? log.service)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getLevelLabel(log.level)}
                    color={getLevelColor(log.level)}
                    size="small"
                    sx={{
                      height: 24,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}
                  />
                </TableCell>
                <TableCell>
                  {log.event ? (
                    <Chip
                      label={getActivityEventLabel(log.event)}
                      color={getActivityEventColor(log.event)}
                      sx={{
                        height: 28,
                        borderRadius: 1,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">—</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {getActivityEventMessage(log)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
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
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
        labelRowsPerPage="Řádků na stránku"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} z ${count}`}
      />
    </Box>
  );
}

