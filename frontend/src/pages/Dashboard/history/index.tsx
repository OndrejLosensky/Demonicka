import { useState } from 'react';
import { Tabs, Tab } from '@mui/material';
import { HistoryTable } from './HistoryTable';
import { useHistory } from './useHistory';
import { LogStats } from './LogStats';

export const History = () => {
  const [activeTab, setActiveTab] = useState(0);
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
  } = useHistory();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">History & Analytics</h1>
      
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className="mb-6"
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab label="Analytics" />
        <Tab label="Detailed History" />
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
    </div>
  );
}; 