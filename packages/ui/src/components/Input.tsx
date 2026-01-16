import React from 'react';
import { TextField } from '../mui/components.js';
import type { TextFieldProps } from '@mui/material';

export interface InputProps extends Omit<TextFieldProps, 'error'> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  ...props
}, ref) => {
  return (
    <TextField
      ref={ref}
      label={label}
      error={!!error}
      helperText={error || helperText}
      fullWidth
      {...props}
    />
  );
});

Input.displayName = 'Input';
