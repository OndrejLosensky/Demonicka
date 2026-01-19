import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Box } from '@demonicka/ui';
import { Tabs, Tab } from '@mui/material';

export function UserDashboardLayout() {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const base = username ? `/u/${encodeURIComponent(username)}/dashboard` : '/u//dashboard';
  const tabValue = location.pathname.startsWith(`${base}/events`) ? 'events' : 'overview';

  return (
    <Box
      sx={{
        maxWidth: '1280px',
        mx: 'auto',
        px: { xs: 2, md: 3 },
        pb: 4,
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => {
            if (v === 'events') navigate(`${base}/events`);
            else navigate(base);
          }}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab value="overview" label="Přehled" />
          <Tab value="events" label="Události" />
        </Tabs>
      </Box>
      <Outlet />
    </Box>
  );
}

