import { useState } from 'react';
import { 
  Tabs, 
  Tab, 
  Button, 
  Box,
  Typography,
  Paper
} from '@mui/material';
import { HistoryTable } from './HistoryTable';
import { useHistory } from './useHistory';
import LogStats from './LogStats';
import { CleanupDialog } from './CleanupDialog';
import { DeleteOutline } from '@mui/icons-material';
import { useTranslations } from '../../../contexts/LocaleContext';
import { tokens } from '../../../theme/tokens';

export const History = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const t = useTranslations<Record<string, unknown>>('dashboard.history');
  const tabs = (t.tabs as Record<string, string>) || {};
  const cleanupLogs = (t.cleanupLogs as Record<string, unknown>) || {};
  const cleanupButton = (cleanupLogs.button as string) ?? 'Vyčistit Logy';
  const {
    logs,
    total,
    isLoading,
    page,
    rowsPerPage,
    level,
    handlePageChange,
    handleRowsPerPageChange,
    handleLevelChange,
    refetch,
  } = useHistory();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">
          {(t.title as string) ?? 'Historie & Analytika'}
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => setIsCleanupOpen(true)}
          size="small"
        >
          {cleanupButton}
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3, borderRadius: tokens.borderRadius.md }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2
          }}
        >
          <Tab 
            label={tabs.analytics ?? 'Analytika'} 
            sx={{ 
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48
            }} 
          />
          <Tab 
            label={tabs.detailedHistory ?? 'Detailní Historie'} 
            sx={{ 
              textTransform: 'none',
              fontWeight: 'medium',
              minHeight: 48
            }} 
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <LogStats />
          )}

          {activeTab === 1 && (
            <HistoryTable
              logs={logs}
              total={total}
              isLoading={isLoading}
              page={page}
              rowsPerPage={rowsPerPage}
              level={level}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onLevelChange={handleLevelChange}
            />
          )}
        </Box>
      </Paper>

      <CleanupDialog
        open={isCleanupOpen}
        onClose={() => setIsCleanupOpen(false)}
        onSuccess={refetch}
      />
    </Box>
  );
}; 