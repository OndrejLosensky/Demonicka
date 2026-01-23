import React from 'react';
import { Button, CircularProgress } from '../mui/components.js';
import type { ButtonProps } from '@mui/material';

export interface LoadingButtonProps extends Omit<ButtonProps, 'startIcon'> {
  loading?: boolean;
  loadingText?: string;
  startIcon?: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  startIcon,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      startIcon={
        loading ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          startIcon
        )
      }
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};
