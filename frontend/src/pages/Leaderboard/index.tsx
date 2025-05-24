import { Typography, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { motion } from 'framer-motion';
import { FaBeer } from 'react-icons/fa';
import { LeaderboardTable } from './LeaderboardTable';
import { useLeaderboard } from './useLeaderboard';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../types/featureFlags';
import translations from '../../locales/cs/dashboard.leaderboard.json';

export default function Leaderboard() {
  const { stats, isLoading, selectedYear, setSelectedYear, AVAILABLE_YEARS } = useLeaderboard();
  const showYearFilter = useFeatureFlag(FeatureFlagKey.LEADERBOARD_YEAR_FILTER);

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
          </Typography>
          
          {showYearFilter && (
            <FormControl variant="outlined" className="min-w-[200px]">
              <InputLabel id="year-select-label">{translations.filters.year.label}</InputLabel>
              <Select
                labelId="year-select-label"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as number)}
                label={translations.filters.year.label}
                className="bg-background-card"
              >
                {AVAILABLE_YEARS.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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