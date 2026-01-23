import React from 'react';
import { Box, Skeleton, Card } from '../mui/components.js';

export interface ChartSkeletonProps {
  height?: number | string;
  showTitle?: boolean;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  height = 300,
  showTitle = true,
}) => {
  return (
    <Card sx={{ borderRadius: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
      {showTitle && (
        <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
      )}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          px: 2,
          pb: 2,
        }}
      >
        {/* Grid lines pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            opacity: 0.1,
          }}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: '100%',
                height: '1px',
                bgcolor: 'text.primary',
              }}
            />
          ))}
        </Box>
        {/* Bar skeletons */}
        {Array.from({ length: 12 }).map((_, idx) => (
          <Skeleton
            key={idx}
            variant="rectangular"
            width="100%"
            height={`${Math.random() * 60 + 20}%`}
            sx={{ borderRadius: '4px 4px 0 0' }}
          />
        ))}
      </Box>
    </Card>
  );
};
