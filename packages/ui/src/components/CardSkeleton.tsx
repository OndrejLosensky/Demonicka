import React from 'react';
import { Box, Skeleton } from '../mui/components.js';
import { Card } from '../mui/components.js';

export interface CardSkeletonProps {
  height?: number | string;
  showTitle?: boolean;
  contentLines?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  height,
  showTitle = true,
  contentLines = 3,
}) => {
  return (
    <Card
      sx={{
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        height: height || '100%',
        p: 2,
      }}
    >
      {showTitle && (
        <Skeleton variant="text" width={120} height={24} sx={{ mb: 1.5 }} />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {Array.from({ length: contentLines }).map((_, idx) => (
          <Skeleton
            key={idx}
            variant="rectangular"
            width={idx === contentLines - 1 ? '80%' : '100%'}
            height={idx === 0 ? 60 : 20}
            sx={{ borderRadius: 1 }}
          />
        ))}
      </Box>
    </Card>
  );
};
