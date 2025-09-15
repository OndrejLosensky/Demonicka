import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
} from '@mui/material';
import {
  DeleteSweep as DeleteSweepIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  LocalBar as BarrelIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { CleanupConfirmDialog } from './CleanupConfirmDialog';
import {
  systemCleanup,
  activeEventCleanup,
  participantsCleanup,
  usersCleanup,
  barrelsCleanup,
  eventsCleanup,
  completeSystemCleanup,
  type CleanupResult,
} from '../utils/cleanupUtils';
import { toast } from 'react-hot-toast';

interface CleanupSectionProps {
  onRefresh?: () => void;
}

export const CleanupSection: React.FC<CleanupSectionProps> = ({ onRefresh }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [dialogConfig, setDialogConfig] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    severity: 'warning' | 'error';
  } | null>(null);

  const handleCleanup = async (
    cleanupFunction: () => Promise<CleanupResult>,
    operationName: string
  ) => {
    setIsLoading(operationName);
    try {
      const result = await cleanupFunction();
      
      if (result.success) {
        toast.success(result.message);
        onRefresh?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      toast.error(`Nepodařilo se provést ${operationName.toLowerCase()}`);
    } finally {
      setIsLoading(null);
    }
  };

  const openDialog = (
    title: string,
    message: string,
    onConfirm: () => Promise<void>,
    severity: 'warning' | 'error' = 'warning'
  ) => {
    setDialogConfig({
      open: true,
      title,
      message,
      onConfirm,
      severity,
    });
  };

  const closeDialog = () => {
    setDialogConfig(null);
  };

  const cleanupOptions = [
    {
      id: 'system',
      title: 'Vyčistit systém',
      description: 'Smazat staré logy a dočasné soubory',
      icon: <DeleteSweepIcon />,
      color: 'primary' as const,
      severity: 'warning' as const,
      action: () => openDialog(
        'Vyčistit systém',
        'Tato akce smaže staré logy a dočasné soubory starší než 30 dní. Tato operace je bezpečná a neovlivní aktuální data.',
        () => handleCleanup(systemCleanup, 'System cleanup')
      ),
    },
    {
      id: 'activeEvent',
      title: 'Vyčistit aktivní událost',
      description: 'Smazat všechna data aktivní události',
      icon: <EventIcon />,
      color: 'warning' as const,
      severity: 'warning' as const,
      action: () => openDialog(
        'Vyčistit aktivní událost',
        'Tato akce smaže všechna data související s aktuální aktivní událostí včetně účastníků, sudů a vypitých piv. Tato operace je nevratná!',
        () => handleCleanup(activeEventCleanup, 'Active event cleanup')
      ),
    },
    {
      id: 'participants',
      title: 'Smazat účastníky',
      description: 'Smazat všechny účastníky (PARTICIPANT role)',
      icon: <PeopleIcon />,
      color: 'error' as const,
      severity: 'error' as const,
      action: () => openDialog(
        'Smazat účastníky',
        'Tato akce smaže všechny účastníky (uživatele s rolí PARTICIPANT). Administrátoři zůstanou zachováni. Tato operace je nevratná!',
        () => handleCleanup(participantsCleanup, 'Participants cleanup'),
        'error'
      ),
    },
    {
      id: 'users',
      title: 'Smazat všechny uživatele',
      description: 'Smazat všechny uživatele včetně administrátorů',
      icon: <PersonIcon />,
      color: 'error' as const,
      severity: 'error' as const,
      action: () => openDialog(
        'Smazat všechny uživatele',
        'Tato akce smaže všechny uživatele včetně administrátorů. Budete odhlášeni a budete muset vytvořit nového administrátora. Tato operace je nevratná!',
        () => handleCleanup(usersCleanup, 'Users cleanup'),
        'error'
      ),
    },
    {
      id: 'barrels',
      title: 'Smazat sudy',
      description: 'Smazat všechny sudy',
      icon: <BarrelIcon />,
      color: 'error' as const,
      severity: 'error' as const,
      action: () => openDialog(
        'Smazat sudy',
        'Tato akce smaže všechny sudy v systému. Tato operace je nevratná!',
        () => handleCleanup(barrelsCleanup, 'Barrels cleanup'),
        'error'
      ),
    },
    {
      id: 'events',
      title: 'Smazat události',
      description: 'Smazat všechny události',
      icon: <CalendarIcon />,
      color: 'error' as const,
      severity: 'error' as const,
      action: () => openDialog(
        'Smazat události',
        'Tato akce smaže všechny události v systému včetně jejich dat. Tato operace je nevratná!',
        () => handleCleanup(eventsCleanup, 'Events cleanup'),
        'error'
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Systémové operace
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Upozornění:</strong> Níže uvedené operace jsou nevratné. Před provedením se ujistěte, 
          že máte zálohu důležitých dat.
        </Typography>
      </Alert>

      <Grid container spacing={2}>
        {cleanupOptions.map((option) => (
          <Grid item xs={12} sm={6} md={4} key={option.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: option.severity === 'error' ? '1px solid #f44336' : '1px solid #ff9800',
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Box color={`${option.color}.main`}>
                    {option.icon}
                  </Box>
                  <Typography variant="h6" component="h3">
                    {option.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  variant="contained"
                  color={option.color}
                  fullWidth
                  onClick={option.action}
                  disabled={isLoading === option.id}
                  startIcon={option.icon}
                >
                  {isLoading === option.id ? 'Probíhá...' : option.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={3}>
        <Card sx={{ border: '2px solid #d32f2f' }}>
          <CardContent>
            <Typography variant="h6" color="error" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon color="error" />
              Kompletní vyčištění systému
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tato operace smaže všechna data v systému včetně uživatelů, událostí, sudů a logů. 
              Budete odhlášeni a budete muset vytvořit nového administrátora.
            </Typography>
            <Button
              variant="contained"
              color="error"
              size="large"
              fullWidth
              onClick={() => openDialog(
                'Kompletní vyčištění systému',
                'Tato akce smaže VŠECHNA data v systému včetně uživatelů, událostí, sudů a logů. Budete odhlášeni a budete muset vytvořit nového administrátora. Tato operace je nevratná!',
                () => handleCleanup(completeSystemCleanup, 'Complete system cleanup'),
                'error'
              )}
              disabled={isLoading === 'complete'}
              startIcon={<DeleteSweepIcon />}
            >
              {isLoading === 'complete' ? 'Probíhá...' : 'Kompletní vyčištění systému'}
            </Button>
          </CardContent>
        </Card>
      </Box>

      {dialogConfig && (
        <CleanupConfirmDialog
          open={dialogConfig.open}
          onClose={closeDialog}
          onConfirm={dialogConfig.onConfirm}
          title={dialogConfig.title}
          message={dialogConfig.message}
          severity={dialogConfig.severity}
          isLoading={isLoading !== null}
        />
      )}
    </Box>
  );
}; 