import React from 'react';
import { Button as MuiButton, CircularProgress } from '../mui/components.js';
import type { ButtonProps as MuiButtonProps } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'contained' | 'outlined' | 'text';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  disabled,
  ...props
}) => {
  // Map custom variants to MUI variants
  let muiVariant: 'contained' | 'outlined' | 'text' = 'contained';
  if (variant === 'outline' || variant === 'outlined') {
    muiVariant = 'outlined';
  } else if (variant === 'text') {
    muiVariant = 'text';
  } else if (variant === 'contained') {
    muiVariant = 'contained';
  }
  const muiColor = variant === 'secondary' ? 'secondary' : 'primary';

  return (
    <MuiButton
      variant={muiVariant}
      color={muiColor}
      fullWidth={fullWidth}
      disabled={disabled || isLoading}
      startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : undefined}
      {...props}
    >
      {children}
    </MuiButton>
  );
};
