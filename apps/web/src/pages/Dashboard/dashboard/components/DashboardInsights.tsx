import { Box, Card, Typography } from '@demonicka/ui';

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
    <Card sx={{ borderRadius: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
          Insights
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
          {eventStartedAtLabel && (
            <Box
              sx={{
                p: 0.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                backgroundColor: 'transparent',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.125, fontSize: '0.625rem' }}>
                Začátek
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>
                {eventStartedAtLabel}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              p: 0.5,
              border: '1px solid',
              borderColor: peakHourBeers > 0 ? 'rgba(255, 59, 48, 0.3)' : 'divider',
              borderRadius: 1,
              backgroundColor: peakHourBeers > 0 ? 'rgba(255, 59, 48, 0.05)' : 'transparent',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.125, fontSize: '0.625rem' }}>
              Peak
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>
              {peakHourLabel}
              {peakHourBeers > 0 && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5, fontWeight: 500, fontSize: '0.75rem' }}>
                  ({peakHourBeers} piv)
                </Typography>
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              p: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              backgroundColor: 'transparent',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 0.125, fontSize: '0.625rem' }}>
              Top uživatel
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>
              {topDrinkerUsername}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
