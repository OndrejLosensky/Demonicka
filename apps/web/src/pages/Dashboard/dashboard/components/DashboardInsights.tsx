import { Box, Card, Typography } from '@demonicka/ui';
import { Chip } from '@mui/material';
import { tokens } from '../../../../theme/tokens';

type Props = {
  eventStartedAtLabel: string;
  peakHourLabel: string;
  peakHourBeers: number;
  topDrinkerUsername: string;
};

export function DashboardInsights({
  eventStartedAtLabel,
  peakHourLabel,
  peakHourBeers,
  topDrinkerUsername,
}: Props) {
  return (
    <Card sx={{ borderRadius: tokens.borderRadius.md }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          Insights
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {eventStartedAtLabel ? <Chip label={`Začátek: ${eventStartedAtLabel}`} size="small" /> : null}
          <Chip
            label={`Peak: ${peakHourLabel}${peakHourBeers > 0 ? ` (${peakHourBeers} piv)` : ''}`}
            size="small"
            color={peakHourBeers > 0 ? 'warning' : 'default'}
            variant={peakHourBeers > 0 ? 'filled' : 'outlined'}
          />
          <Chip label={`Top: ${topDrinkerUsername}`} size="small" color="primary" variant="outlined" />
        </Box>

        <Typography variant="body2" color="text.secondary">
          Tip: tahle část je ideální pro další „zajímavosti“ (např. posledních 15 minut, tempo vs. včera, apod.).
        </Typography>
      </Box>
    </Card>
  );
}

