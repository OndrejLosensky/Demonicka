import React from 'react';
import { Card, Box, Typography } from '../mui/components.js';
import { Link } from 'react-router-dom';
import { ChevronRight } from '@mui/icons-material';

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  to?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, color = 'primary', to, onClick }) => {
  const isClickable = Boolean(to || onClick);
  const titleContent = (
    <Typography 
      variant="body2" 
      color="text.secondary" 
      sx={{ 
        fontSize: '0.75rem',
        fontWeight: 500,
        lineHeight: 1.2,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        ...(isClickable && {
          cursor: 'pointer',
          '&:hover': {
            color: 'primary.main',
          },
        }),
      }}
    >
      {title}
      {isClickable && <ChevronRight sx={{ fontSize: '1rem', ml: 0.5, color: 'text.secondary' }} />}
    </Typography>
  );

  const cardContent = (
    <Card 
      component={to ? Link : 'div'}
      {...(to ? { to } : {})}
      onClick={!to ? onClick : undefined}
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
        textDecoration: 'none',
        color: 'inherit',
        ...(isClickable && {
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
        {icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.secondary',
              flexShrink: 0,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { fontSize: '1.25rem', opacity: 0.7 } 
            })}
          </Box>
        )}
        {titleContent}
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

  return cardContent;
};
