import React, { useState } from 'react';
import { Box, PageHeader, Paper } from '@demonicka/ui';
import { useActivityLogs } from '../../../hooks/useActivityLogs';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { toast } from 'react-hot-toast';
import type { ActivityLogEntry } from './activity.types';
import { ActivityFilters } from './ActivityFilters';
import { ActivityTable } from './ActivityTable';
import { ActivityLogDetailDialog } from './ActivityLogDetailDialog';

export const Activity: React.FC = () => {
  usePageTitle('Aktivita');
  const {
    logs,
    total,
    isLoading,
    page,
    rowsPerPage,
    selectedEvent,
    selectedLevel,
    selectedDate,
    search,
    autoRefresh,
    setPage,
    setRowsPerPage,
    setSelectedEvent,
    setSelectedLevel,
    setSelectedDate,
    setSearch,
    setAutoRefresh,
    reload,
  } = useActivityLogs();
  const [detailLog, setDetailLog] = useState<ActivityLogEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (log: ActivityLogEntry) => {
    setDetailLog(log);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailLog(null);
  };

  const handleCopyJson = async () => {
    if (!detailLog) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(detailLog, null, 2));
      toast.success('JSON zkopírován');
    } catch {
      toast.error('Nepodařilo se zkopírovat JSON');
    }
  };

  return (
    <Box>
      <PageHeader title="Aktivita" />

      <Paper sx={{ mb: 3, borderRadius: 1, p: 2.5 }}>
        <ActivityFilters
          value={selectedEvent}
          onChange={setSelectedEvent}
          level={selectedLevel}
          onLevelChange={setSelectedLevel}
          date={selectedDate}
          onDateChange={setSelectedDate}
          search={search}
          onSearchChange={setSearch}
          autoRefresh={autoRefresh}
          onAutoRefreshChange={setAutoRefresh}
          onRefresh={reload}
        />
        <ActivityTable
          logs={logs}
          isLoading={isLoading}
          total={total}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={setRowsPerPage}
          onRowClick={openDetail}
        />
      </Paper>

      <ActivityLogDetailDialog open={detailOpen} log={detailLog} onClose={closeDetail} onCopy={handleCopyJson} />
    </Box>
  );
};

