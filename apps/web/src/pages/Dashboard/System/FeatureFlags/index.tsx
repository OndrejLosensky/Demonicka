import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { LoadingButton, TableSkeleton } from '@demonicka/ui';
import { featureFlagsService, type FeatureFlag } from '../../../../services/featureFlagsService';
import { FeatureFlagKey } from '@demonicka/shared-types';
import { toast } from 'react-hot-toast';
import { useFeatureFlags } from '../../../../contexts/FeatureFlagsContext';

const FeatureFlagsPage: React.FC = () => {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const { refreshFlags } = useFeatureFlags();

  const loadFeatureFlags = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await featureFlagsService.getAllFeatureFlags();
      setFeatureFlags(data);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      toast.error('Nepodařilo se načíst feature flags');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeatureFlags();
  }, [loadFeatureFlags]);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      setIsSaving((prev) => ({ ...prev, [flag.id]: true }));
      await featureFlagsService.updateFeatureFlag(flag.id, !flag.enabled);
      toast.success('Feature flag byl úspěšně aktualizován');
      await Promise.all([loadFeatureFlags(), refreshFlags()]);
    } catch (error) {
      console.error('Failed to update feature flag:', error);
      toast.error('Nepodařilo se aktualizovat feature flag');
    } finally {
      setIsSaving((prev) => ({ ...prev, [flag.id]: false }));
    }
  };

  // Get all feature flag keys from enum for display
  const allFeatureFlagKeys = Object.values(FeatureFlagKey);

  if (isLoading) {
    return (
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Funkce
          </Typography>
          <LoadingButton
            variant="outlined"
            startIcon={<RefreshIcon />}
            loading={isLoading}
            disabled
          >
            Obnovit
          </LoadingButton>
        </Box>
        <TableSkeleton rows={10} columns={4} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight="bold">
          Funkce
        </Typography>
        <LoadingButton
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadFeatureFlags}
          loading={isLoading}
        >
          Obnovit
        </LoadingButton>
      </Box>

      <Box>
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Funkce</TableCell>
                <TableCell>Popis</TableCell>
                <TableCell align="center">Stav</TableCell>
                <TableCell align="right">Akce</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allFeatureFlagKeys.map((key) => {
                const flag = featureFlags.find((f) => f.key === key);
                if (!flag) return null;

                return (
                  <TableRow key={flag.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {flag.key}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={flag.description || ''}>
                        <Typography variant="body2" color="text.secondary">
                          {flag.description || 'Bez popisu'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Switch
                        checked={flag.enabled}
                        onChange={() => handleToggle(flag)}
                        disabled={isSaving[flag.id]}
                        color="primary"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {isSaving[flag.id] && (
                        <CircularProgress size={20} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default FeatureFlagsPage;
