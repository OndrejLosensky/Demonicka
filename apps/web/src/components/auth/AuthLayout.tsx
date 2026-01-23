import type { ReactNode } from 'react';
import { Card, Box } from '@demonicka/ui';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.palette.background.default,
        py: 3,
        px: { xs: 2, sm: 3, lg: 4 },
      }}
    >
      <Box sx={{ width: '100%', maxWidth: '28rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Back link */}
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: theme.palette.text.secondary,
            textDecoration: 'none',
            transition: 'color 0.2s',
            '&:hover': {
              color: theme.palette.text.primary,
            },
          }}
        >
          <svg style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Zpět na hlavní stránku
        </Box>

        {/* Auth card */}
        <Card 
          sx={{
            width: '100%',
            boxShadow: 3,
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3, pt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
              <img
                src="/logo.svg"
                alt="Logo"
                style={{ height: '3rem', width: 'auto' }}
              />
            </Box>
            <Box
              component="h2"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                mb: subtitle ? 1 : 0,
              }}
            >
              {title}
            </Box>
            {subtitle && (
              <Box
                component="p"
                sx={{
                  mt: 1,
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                }}
              >
                {subtitle}
              </Box>
            )}
          </Box>
          <Box sx={{ px: 3, pb: 3 }}>
            {children}
          </Box>
        </Card>
      </Box>
    </Box>
  );
} 