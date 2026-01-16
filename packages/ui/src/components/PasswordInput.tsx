import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment } from '../mui/components.js';
import { Visibility, VisibilityOff } from '../mui/icons.js';
import type { TextFieldProps } from '@mui/material';

export interface PasswordInputProps extends Omit<TextFieldProps, 'type' | 'error'> {
  error?: string;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  label,
  error,
  helperText,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <TextField
      type={showPassword ? 'text' : 'password'}
      label={label}
      error={!!error}
      helperText={error || helperText}
      fullWidth
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};
