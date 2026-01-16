import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Chip } from '@demonicka/ui';
import { AccessTime as AccessTimeIcon, Event as EventIcon } from '@demonicka/ui';
import { format } from 'date-fns';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import type { Event } from '@demonicka/shared-types';

export function ActiveEventDisplay() {
  const { activeEvent } = useActiveEvent();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!activeEvent) return null;

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        bgcolor: 'background.secondary',
        backdropFilter: 'blur(8px)',
        borderRadius: 1,
        px: 1.5,
        py: 0.75,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography
            variant="body2"
            sx={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              fontWeight: 500,
            }}
          >
            {format(currentTime, 'HH:mm:ss')}
          </Typography>
        </Box>
        <Box sx={{ width: '1px', height: 16, bgcolor: 'divider', mx: 0.5 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Chip
            label={activeEvent.name}
            size="small"
            sx={{
              height: 20,
              fontSize: '0.7rem',
              fontWeight: 500,
              px: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              '& .MuiChip-label': {
                px: 1,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
