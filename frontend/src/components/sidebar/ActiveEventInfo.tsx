import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { Event as EventIcon, AccessTime as AccessTimeIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useActiveEvent } from '../../contexts/ActiveEventContext';
import { useSidebar } from '../../contexts/SidebarContext';

export const ActiveEventInfo: React.FC = () => {
  const { activeEvent } = useActiveEvent();
  const { isCollapsed } = useSidebar();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!activeEvent) {
    return null;
  }

  // When collapsed, show only a compact version
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Tooltip 
          title={`${activeEvent.name} - ${format(currentTime, 'HH:mm:ss')}`} 
          arrow 
          placement="right"
        >
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'center',
            p: 1,
            mx: 1,
            mt: 1,
            bgcolor: 'background.default', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
          }}>
            {/* Background gradient */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                opacity: 0.8
              }}
            />
            <EventIcon 
              className="text-primary" 
              fontSize="small"
            />
          </Box>
        </Tooltip>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ 
        p: 2, 
        mx: 2, 
        mt: 2,
        bgcolor: 'background.default', 
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background gradient */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
            opacity: 0.8
          }}
        />

        <Typography 
          variant="subtitle2" 
          className="text-text-primary font-semibold mb-2"
          sx={{ fontSize: '0.8rem', fontWeight: 600 }}
        >
          Aktivní událost
        </Typography>

        {/* Event Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EventIcon 
            className="text-text-secondary" 
            fontSize="small" 
            sx={{ mr: 1, opacity: 0.7 }}
          />
          <Chip
            label={activeEvent.name}
            size="small"
            className="bg-primary/10 text-primary border-primary/20"
            sx={{
              '& .MuiChip-label': {
                fontSize: '0.75rem',
                fontWeight: 500,
                px: 1,
              },
              height: 22,
              borderRadius: '11px',
              maxWidth: '100%',
            }}
          />
        </Box>

        {/* Current Time */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon 
              className="text-text-secondary" 
              fontSize="small" 
              sx={{ mr: 1, opacity: 0.7 }}
            />
            <Typography 
              variant="body2" 
              className="text-text-primary font-mono font-medium"
              sx={{ 
                fontVariantNumeric: 'tabular-nums',
                fontSize: '0.8rem'
              }}
            >
              {format(currentTime, 'HH:mm:ss')}
            </Typography>
          </Box>

          <Tooltip title="Obnovit čas" arrow placement="top">
            <IconButton
              size="small"
              onClick={() => setCurrentTime(new Date())}
              sx={{
                width: 24,
                height: 24,
                opacity: 0.6,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'action.hover'
                }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  );
};
