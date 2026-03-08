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
  IconButton,
  Collapse,
  Paper,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BuildCircle as RecoverIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useToast } from '../../../hooks/useToast';
import { jobsService, type JobResponse, type JobStatus } from '../../../services/jobsService';
import { websocketService } from '../../../services/websocketService';
import { useAuth } from '../../../contexts/AuthContext';
import { USER_ROLE } from '@demonicka/shared-types';

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
  'cleanup.system': 'Vyčistit systém',
  'cleanup.activeEvent': 'Vyčistit aktivní událost',
  'clearAllLogs': 'Smazat všechny logy',
  'achievements.check': 'Kontrola achievementů',
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
  const { user } = useAuth();
  const toast = useToast();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const isAdmin =
    user?.role === USER_ROLE.SUPER_ADMIN || user?.role === USER_ROLE.OPERATOR;

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

  const handleRecover = async () => {
    if (!isAdmin) return;
    try {
      setRecovering(true);
      const { markedFailed, requeued } = await jobsService.recover();
      loadJobs();
      toast.success(
        `Obnoveno: ${markedFailed} úloh označeno jako selhané, ${requeued} úloh znovu zařazeno do fronty.`,
      );
    } catch (err) {
      console.error('Recover failed:', err);
      toast.error('Obnovení fronty se nezdařilo.');
    } finally {
      setRecovering(false);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      setCancellingId(jobId);
      const { cancelled } = await jobsService.cancel(jobId);
      if (cancelled) {
        loadJobs();
        toast.success('Úloha zrušena.');
      } else {
        toast.success('Úloha již byla dokončena nebo zrušena.');
      }
    } catch (err) {
      console.error('Cancel failed:', err);
      toast.error('Zrušení úlohy se nezdařilo.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Úlohy na pozadí
        </Typography>
        <Box display="flex" gap={1}>
          {isAdmin && (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<RecoverIcon />}
              onClick={handleRecover}
              disabled={loading || recovering}
            >
              Obnovit frontu
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => loadJobs()}
            disabled={loading}
          >
            Obnovit
          </Button>
        </Box>
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
                        <IconButton
                          size="small"
                          onClick={() =>
                            setExpandedId((id) => (id === job.id ? null : job.id))
                          }
                          aria-label={expandedId === job.id ? 'Skrýt detail' : 'Zobrazit detail'}
                        >
                          {expandedId === job.id ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
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
                        {(job.status === 'QUEUED' || job.status === 'RUNNING') && (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancel(job.id)}
                            disabled={cancellingId === job.id}
                          >
                            Zrušit
                          </Button>
                        )}
                        {job.status === 'FAILED' && job.error ? (
                          <Typography variant="caption" color="error">
                            Zobrazit chybu
                          </Typography>
                        ) : null}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ py: 0, borderBottom: 0 }}>
                        <Collapse in={expandedId === job.id} timeout="auto">
                          <Box sx={{ px: 2, pb: 2 }}>
                            {job.logs && job.logs.length > 0 && (
                                <Box
                                  sx={{
                                    py: 1.5,
                                    px: 2,
                                    mb: job.error ? 1.5 : 0,
                                    bgcolor: (theme) =>
                                      theme.palette.mode === 'dark'
                                        ? 'grey.800'
                                        : 'grey.200',
                                    color: 'text.primary',
                                    borderRadius: 1,
                                    maxHeight: 200,
                                    overflow: 'auto',
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    display="block"
                                    gutterBottom
                                    color="text.primary"
                                  >
                                    Log úlohy
                                  </Typography>
                                  {job.logs.map((entry, i) => (
                                    <Typography
                                      key={i}
                                      variant="caption"
                                      component="div"
                                      sx={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.75rem',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        color: 'text.primary',
                                        py: 0.25,
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          color: 'text.secondary',
                                          mr: 1,
                                        }}
                                      >
                                        {formatDate(entry.timestamp)} [{entry.level}]
                                      </Box>
                                      {entry.message}
                                    </Typography>
                                  ))}
                                </Box>
                              )}
                              {job.error && (
                                <Box
                                  sx={{
                                    py: 1.5,
                                    px: 2,
                                    bgcolor: 'error.dark',
                                    color: 'error.contrastText',
                                    borderRadius: 1,
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    fontWeight="bold"
                                    display="block"
                                    gutterBottom
                                    sx={{ color: 'inherit' }}
                                  >
                                    Chyba
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    component="pre"
                                    sx={{
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-word',
                                      fontFamily: 'monospace',
                                      fontSize: '0.75rem',
                                      color: 'inherit',
                                    }}
                                  >
                                    {job.error}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
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
