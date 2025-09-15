import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Celebration as PartyIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import translations from '../../locales/cs/dashboard.json';

interface EmptyEventStateProps {
  title?: string;
  subtitle?: string;
}

export const EmptyEventState: React.FC<EmptyEventStateProps> = ({ 
  title = translations.noActiveEvent.title,
  subtitle = translations.noActiveEvent.subtitle,
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      textAlign: 'center', 
      mt: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 2
    }}>
      <PartyIcon sx={{ fontSize: 60, color: 'primary.main' }} />
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Typography color="textSecondary" gutterBottom>
        {subtitle}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => navigate('/events')}
        size="large"
      >
        {translations.noActiveEvent.createButton}
      </Button>
    </Box>
  );
}; 