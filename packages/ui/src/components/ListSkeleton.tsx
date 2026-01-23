import React from 'react';
import { Box, Skeleton } from '../mui/components.js';
import { Grid } from '../mui/components.js';

export interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 4,
  showAvatar = true,
}) => {
  return (
    <Grid container spacing={1.5} sx={{ width: '100%' }}>
      {Array.from({ length: items }).map((_, idx) => (
        <Grid item xs key={idx} sx={{ display: 'flex' }}>
          <Box
            sx={{
              p: 1.25,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.75,
              width: '100%',
            }}
          >
            <Skeleton variant="circular" width={24} height={24} />
            {showAvatar && (
              <Skeleton variant="circular" width={40} height={40} />
            )}
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <Skeleton variant="text" width="80%" height={16} sx={{ mx: 'auto', mb: 0.25 }} />
              <Skeleton variant="text" width="60%" height={12} sx={{ mx: 'auto' }} />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};
