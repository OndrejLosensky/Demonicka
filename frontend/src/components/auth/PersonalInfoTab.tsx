import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient as api } from '../../utils/apiClient';

export const PersonalInfoTab = () => {
  const { user, refreshUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.patch('/users/me', {
        firstName,
        lastName,
      });
      await refreshUser();
      setSuccess(true);
    } catch (error) {
      console.error('Failed to update personal information:', error);
      setError('Failed to update personal information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          margin="normal"
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Personal information updated successfully
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          sx={{ mt: 3 }}
          fullWidth
        >
          {isLoading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Updating...
            </>
          ) : (
            'Update'
          )}
        </Button>
      </Box>
    </Paper>
  );
}; 