import React from 'react';
import { Box, Typography } from '../mui/components.js';

export interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  left?: React.ReactNode;
  noMargin?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, action, left, noMargin }) => {
  return (
    <Box sx={{ ...(noMargin ? {} : { mb: 3 }), display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
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
