import { useState } from 'react';
import { Tabs, Tab, Button } from '@mui/material';
import { HistoryTable } from './HistoryTable';
import { useHistory } from './useHistory';
import { LogStats } from './LogStats';
import { CleanupDialog } from './CleanupDialog';
import { DeleteOutline } from '@mui/icons-material';
import translations from '../../../locales/cs/dashboard.history.json';

export const History = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{translations.title}</h1>
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutline />}
          onClick={() => setIsCleanupOpen(true)}
        >
          {translations.cleanupLogs.button}
        </Button>
      </div>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className="mb-6"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label={translations.tabs.analytics} />
        <Tab label={translations.tabs.detailedHistory} />
      </Tabs>

      {activeTab === 0 && (
        <section>
          <LogStats />
        </section>
      )}

      {activeTab === 1 && (
        <section>
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
        </section>
      )}

      <CleanupDialog
        open={isCleanupOpen}
        onClose={() => setIsCleanupOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}; 