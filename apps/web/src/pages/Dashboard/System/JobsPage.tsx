import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Tooltip,
  IconButton,
  Collapse,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { jobsService, type JobResponse, type JobStatus } from '../../../services/jobsService';
import { websocketService } from '../../../services/websocketService';

const statusLabel: Record<JobStatus, string> = {
  QUEUED: 'Ve frontě',
  RUNNING: 'Běží',
  COMPLETED: 'Dokončeno',
  FAILED: 'Selhalo',
};

const statusColor: Record<JobStatus, 'default' | 'primary' | 'success' | 'error'> = {
  QUEUED: 'default',
  RUNNING: 'primary',
  COMPLETED: 'success',
  FAILED: 'error',
};

const typeLabel: Record<string, string> = {
  'backup.run': 'Záloha DB',
};

function formatDate(s: string | null): string {
  if (!s) return '–';
  try {
    return new Date(s).toLocaleString('cs-CZ');
  } catch {
    return s;
  }
}

export const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await jobsService.list({ limit: 50 });
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const handleJobUpdated = () => {
      loadJobs();
    };
    websocketService.subscribe('job:updated', handleJobUpdated);
    return () => websocketService.unsubscribe('job:updated', handleJobUpdated);
  }, [loadJobs]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Úlohy na pozadí
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => loadJobs()}
          disabled={loading}
        >
          Obnovit
        </Button>
      </Box>

      {loading && jobs.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell>Typ</TableCell>
                <TableCell>Stav</TableCell>
                <TableCell>Zadal</TableCell>
                <TableCell>Vytvořeno</TableCell>
                <TableCell>Dokončeno</TableCell>
                <TableCell align="right">Akce</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Žádné úlohy</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jobs.map((job) => (
                  <React.Fragment key={job.id}>
                    <TableRow hover>
                      <TableCell>
                        {job.error && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              setExpandedId((id) => (id === job.id ? null : job.id))
                            }
                            aria-label={expandedId === job.id ? 'Skrýt chybu' : 'Zobrazit chybu'}
                          >
                            {expandedId === job.id ? (
                              <ExpandLessIcon fontSize="small" />
                            ) : (
                              <ExpandMoreIcon fontSize="small" />
                            )}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {typeLabel[job.type] ?? job.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabel[job.status]}
                          size="small"
                          color={statusColor[job.status]}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {job.createdByUser?.username ?? '–'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatDate(job.createdAt)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(job.finishedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {job.status === 'FAILED' && job.error ? (
                          <Typography variant="caption" color="error">
                            Zobrazit chybu
                          </Typography>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    {job.error && (
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, borderBottom: 0 }}>
                          <Collapse in={expandedId === job.id} timeout="auto">
                            <Box sx={{ py: 2, px: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                              <Typography
                                variant="caption"
                                component="pre"
                                sx={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {job.error}
                              </Typography>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
