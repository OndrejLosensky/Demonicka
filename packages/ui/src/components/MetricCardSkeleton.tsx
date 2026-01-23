import React from 'react';
import { Box, Skeleton } from '../mui/components.js';
import { Card } from '../mui/components.js';

export const MetricCardSkeleton: React.FC = () => {
  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        <Skeleton variant="circular" width={20} height={20} />
        <Skeleton variant="text" width={80} height={16} />
      </Box>
      <Skeleton variant="text" width="60%" height={36} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="40%" height={14} />
    </Card>
  );
};
