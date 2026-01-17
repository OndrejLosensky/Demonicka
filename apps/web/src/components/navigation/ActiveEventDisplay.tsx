import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '@demonicka/ui';
import { AccessTime as AccessTimeIcon, Event as EventIcon } from '@demonicka/ui';
import { format } from 'date-fns';
import { useActiveEvent } from '../../contexts/ActiveEventContext';

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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography
          variant="body2"
          sx={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            fontWeight: 400,
            color: 'text.secondary',
          }}
        >
          {format(currentTime, 'HH:mm:ss')}
        </Typography>
      </Box>
      <Box sx={{ width: '1px', height: 14, bgcolor: 'divider' }} />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <EventIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
        <Typography
          variant="body2"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'text.primary',
          }}
        >
          {activeEvent.name}
        </Typography>
      </Box>
    </Box>
  );
}
