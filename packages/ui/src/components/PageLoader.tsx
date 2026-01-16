import React from 'react';
import { motion } from 'framer-motion';
import { Box, Typography } from '../mui/components.js';
import { SportsBar as BeerIcon } from '../mui/icons.js';

export interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ 
  message = 'Načítání...'
}) => {
  return (
    <Box
      sx={{
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <Box sx={{ position: 'relative' }}>
        {/* Beer mug container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          <BeerIcon 
            sx={{ 
              fontSize: '4rem',
              color: 'primary.main',
              opacity: 0.2,
            }} 
          />
        </motion.div>

        {/* Animated beer foam */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
          }}
          animate={{
            y: [-20, 20],
            x: [-20, 20],
            scale: [1, 1.5, 1],
            opacity: [0.8, 0.3, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Loading spinner */}
        <motion.div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '60px',
            height: '60px',
            marginLeft: '-30px',
            marginTop: '-30px',
            border: '3px solid rgba(0, 0, 0, 0.1)',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
          }}
          animate={{
            rotate: 360
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </Box>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.5,
          ease: "easeOut"
        }}
      >
        <Typography 
          variant="h6" 
          color="textSecondary"
          sx={{ 
            fontWeight: 500,
            textAlign: 'center',
            maxWidth: '300px',
          }}
        >
          {message}
        </Typography>
      </motion.div>
    </Box>
  );
};
