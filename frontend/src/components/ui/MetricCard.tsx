import React from 'react';
import { Card, Box, Typography } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color = 'primary' }) => {
  return (
    <Card sx={{ p: 3, borderRadius: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        {icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'common.white',
            }}
          >
            {icon}
          </Box>
        )}
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};


