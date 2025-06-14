import { Typography, Grid, Box, Container } from '@mui/material';
import { motion } from 'framer-motion';
import { FaBeer } from 'react-icons/fa';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboard } from './useLeaderboard';
import { EventSelector } from '../../components/EventSelector';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../types/featureFlags';
import translations from '../../locales/cs/dashboard.leaderboard.json';
import { EmptyEventState } from '../../components/EmptyEventState';
import { useActiveEvent } from '../../contexts/ActiveEventContext';

export default function Leaderboard() {
  const { stats, isLoading, selectedEvent } = useLeaderboard();
  const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
  const { activeEvent } = useActiveEvent();

  if (!activeEvent) {
    return (
      <Container>
        <EmptyEventState
          title={translations.emptyState.title}
          subtitle={translations.emptyState.subtitle}
        />
      </Container>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <FaBeer className="text-4xl text-primary animate-bounce" />
          <Typography>{translations.loading}</Typography>
        </motion.div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[400px]">
        <Typography>{translations.noData}</Typography>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 space-y-8"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="text-center space-y-6"
      >
        <div className="inline-block bg-primary/5 p-6 rounded-2xl">
          <Typography variant="h3" className="flex items-center justify-center gap-4 text-primary font-bold">
            <FaBeer className="text-4xl" />
            {translations.title}
            <FaBeer className="text-4xl" />
          </Typography>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <Typography variant="h6" className="text-text-secondary font-medium">
            {translations.subtitle}
            {selectedEvent && (
              <span className="block text-primary font-bold mt-2">
                {selectedEvent.name}
              </span>
            )}
          </Typography>
          
          {showEventHistory && (
            <Box>
              <EventSelector />
            </Box>
          )}
        </div>
      </motion.div>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <LeaderboardTable participants={stats.males} title={translations.sections.men} />
        </Grid>
        <Grid item xs={12} md={6}>
          <LeaderboardTable participants={stats.females} title={translations.sections.women} />
        </Grid>
      </Grid>
    </motion.div>
  );
} 