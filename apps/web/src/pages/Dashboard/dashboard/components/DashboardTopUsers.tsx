import { Box, Card, Typography } from '@demonicka/ui';
import { Grid, Chip } from '@mui/material';
import { EmojiEvents as TrophyIcon } from '@mui/icons-material';
import type { UserStats } from '../../../../types/dashboard';
import { UserAvatar } from '../../../../components/UserAvatar';
import { tokens } from '../../../../theme/tokens';

type Props = {
  users: UserStats[];
};

export function DashboardTopUsers({ users }: Props) {
  return (
    <Card sx={{ borderRadius: tokens.borderRadius.md }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <TrophyIcon sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Nejlepší uživatelé
          </Typography>
        </Box>

        {users.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Zatím žádná data.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {users.slice(0, 12).map((u, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={u.id}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: tokens.borderRadius.md,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    backgroundColor: idx === 0 ? 'primary.50' : 'background.paper',
                  }}
                >
                  <UserAvatar
                    user={{
                      username: u.username,
                      profilePictureUrl: u.profilePictureUrl,
                      name: u.name ?? u.username,
                    }}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: idx === 0 ? 'primary.main' : 'grey.500',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {u.beerCount} piv
                    </Typography>
                  </Box>
                  {idx === 0 ? (
                    <Chip label="Top" size="small" color="warning" sx={{ fontWeight: 800 }} />
                  ) : null}
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Card>
  );
}

