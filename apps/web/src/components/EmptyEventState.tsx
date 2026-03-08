import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon, Celebration as PartyIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslations } from '../contexts/LocaleContext';

interface EmptyEventStateProps {
  title?: string;
  subtitle?: string;
}

export const EmptyEventState: React.FC<EmptyEventStateProps> = ({ title, subtitle }) => {
  const navigate = useNavigate();
  const t = useTranslations<{ noActiveEvent: { title: string; subtitle: string; createButton: string } }>('dashboard');
  const displayTitle = title ?? t.noActiveEvent?.title;
  const displaySubtitle = subtitle ?? t.noActiveEvent?.subtitle;
  const createLabel = t.noActiveEvent?.createButton;

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
        {displayTitle}
      </Typography>
      <Typography color="textSecondary" gutterBottom>
        {displaySubtitle}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => navigate('/dashboard/events')}
        size="large"
      >
        {createLabel}
      </Button>
    </Box>
  );
}; 