import React from 'react';
import { Box, Typography } from '../mui/components.js';

export interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  left?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, action, left }) => {
  return (
    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        {left}
      </Box>
      {action}
    </Box>
  );
};
