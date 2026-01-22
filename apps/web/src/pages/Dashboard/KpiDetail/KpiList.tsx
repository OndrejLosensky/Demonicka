import { Box, Typography, Card } from '@demonicka/ui';
import { Grid, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { ChevronRight } from '@mui/icons-material';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';

const kpis = [
  {
    id: 'total-beers',
    title: 'Celkem piv',
    description: 'Celkový počet vypitých piv v aktivní události',
    path: '/dashboard/kpi/total-beers',
  },
  {
    id: 'avg-per-hour',
    title: 'Průměr / hod',
    description: 'Průměrný počet piv vypitých za hodinu',
    path: '/dashboard/kpi/avg-per-hour',
  },
  {
    id: 'avg-per-person',
    title: 'průměr / os.',
    description: 'Průměrný počet piv na účastníka',
    path: '/dashboard/kpi/avg-per-person',
  },
];

export function KpiList() {
  const { activeEvent } = useActiveEvent();

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState />
      </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Grid container spacing={2}>
        {kpis.map((kpi) => (
          <Grid item xs={12} sm={6} md={4} key={kpi.id}>
            <Card
              component={Link}
              to={kpi.path}
              sx={{
                p: 3,
                borderRadius: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                textDecoration: 'none',
                color: 'inherit',
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {kpi.title}
                </Typography>
                <ChevronRight sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {kpi.description}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
