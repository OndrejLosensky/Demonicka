import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import type { Barrel } from '@demonicka/shared-types';
import { FaBeer } from 'react-icons/fa';

interface ActiveBarrelGraphProps {
  barrel: Barrel | undefined;
}

export const ActiveBarrelGraph: React.FC<ActiveBarrelGraphProps> = ({ barrel }) => {
  if (!barrel) {
    return (
      <Box 
        sx={{ 
          height: 300, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2,
          color: 'text.secondary'
        }}
      >
        <FaBeer style={{ fontSize: '4rem', opacity: 0.5 }} />
        <Typography>Není aktivní žádný sud</Typography>
      </Box>
    );
  }

  const remainingLitres = Number(barrel.remainingLitres || 0);
  const totalLitres = Number(barrel.totalLitres || 0);
  const percentage = totalLitres > 0 ? (remainingLitres / totalLitres) * 100 : 0;
  const color = percentage === 0 ? 'error.main' : 'success.main';
  const size = 250;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 300,
      position: 'relative'
    }}>
      <Box sx={{ position: 'relative' }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{ color: 'grey.200', position: 'absolute' }}
        />
        <CircularProgress
          variant="determinate"
          value={percentage}
          size={size}
          thickness={4}
          sx={{ color, transform: 'rotate(0deg)' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FaBeer style={{ fontSize: '2rem', color: color }} />
            <Typography variant="h4" component="div" color={color} sx={{ fontWeight: 'bold' }}>
              {remainingLitres.toFixed(1)} L
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            z celkových {totalLitres.toFixed(1)} L
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 'bold' }}>
            {barrel.size}L
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}; 