import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import {
  SportsBar as BeerPongIcon,
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { usePageTitle } from '../../../../hooks/usePageTitle';
import { PageHeader } from '../../../../components/ui/PageHeader';

const BeerPong: React.FC = () => {
  usePageTitle('Beer Pong');

  return (
    <Box>
      <PageHeader
        title="Beer Pong"
        subtitle="Správa Beer Pong turnajů a her"
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            color="primary"
          >
            Nový turnaj
          </Button>
        }
      />

      {/* Status Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <BeerPongIcon color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Aktivní hry
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PlayIcon color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dokončené turnaje
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StopIcon color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Čekající hry
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <RefreshIcon color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    0
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Celkem hráčů
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Beer Pong Turnaje
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip label="Všechny" color="primary" />
            <Chip label="Aktivní" variant="outlined" />
            <Chip label="Dokončené" variant="outlined" />
          </Box>
        </Box>

        {/* Placeholder Content */}
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <BeerPongIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Žádné Beer Pong turnaje
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Vytvořte svůj první Beer Pong turnaj a začněte hrát!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
          >
            Vytvořit turnaj
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default BeerPong;
