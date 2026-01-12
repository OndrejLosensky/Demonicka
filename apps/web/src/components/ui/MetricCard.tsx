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
    <Card sx={{ 
      p: 2, 
      borderRadius: 2, 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        {icon && (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'common.white',
              flexShrink: 0,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { fontSize: '1rem' } 
            })}
          </Box>
        )}
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            fontSize: '0.75rem',
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
      </Box>
      
      <Typography 
        variant="h4" 
        sx={{ 
          fontWeight: 'bold', 
          lineHeight: 1, 
          fontSize: '1.5rem',
          color: 'text.primary',
          textAlign: 'left',
          mb: subtitle ? 0.5 : 0,
        }}
      >
        {value}
      </Typography>
      
      {subtitle && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            fontSize: '0.7rem',
            opacity: 0.8,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};


