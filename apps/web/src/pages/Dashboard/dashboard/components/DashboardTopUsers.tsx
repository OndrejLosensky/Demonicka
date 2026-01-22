import { Box, Card, Typography } from '@demonicka/ui';
import { Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import { ChevronRight } from '@mui/icons-material';
import type { UserStats } from '../../../../types/dashboard';
import { UserAvatar } from '../../../../components/UserAvatar';

type Props = {
  users: UserStats[];
};

export function DashboardTopUsers({ users }: Props) {
  const topUsers = users.slice(0, 4);

  return (
    <Card sx={{ borderRadius: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Link
            to="/dashboard/top-users"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              Nejlepší uživatelé
            </Typography>
            <ChevronRight sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
          </Link>
        </Box>

        {topUsers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Zatím žádná data.
          </Typography>
        ) : (
          <Grid container spacing={1.5} sx={{ width: '100%' }}>
            {topUsers.map((u, idx) => (
              <Grid item xs key={u.id} sx={{ display: 'flex' }}>
                <Box
                  sx={{
                    p: 1.25,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.75,
                    backgroundColor: idx === 0 ? 'rgba(255, 59, 48, 0.05)' : 'transparent',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    width: '100%',
                    '&:hover': {
                      borderColor: idx === 0 ? 'primary.main' : 'divider',
                      backgroundColor: idx === 0 ? 'rgba(255, 59, 48, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 1,
                      bgcolor: idx === 0 ? 'primary.main' : 'transparent',
                      color: idx === 0 ? 'white' : 'text.secondary',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                    }}
                  >
                    {idx + 1}
                  </Box>
                  <UserAvatar
                    user={{
                      username: u.username,
                      profilePictureUrl: u.profilePictureUrl,
                      name: u.name ?? u.username,
                    }}
                    sx={{
                      width: 40,
                      height: 40,
                      fontSize: '0.875rem',
                      fontWeight: 800,
                    }}
                  />
                  <Box sx={{ width: '100%' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 700, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '0.8rem',
                        mb: 0.25,
                      }}
                    >
                      {u.username}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                      {u.beerCount} piv
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Card>
  );
}

