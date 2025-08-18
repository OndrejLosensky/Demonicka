import { Paper, Typography, Box, Chip } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { GiTrophy } from 'react-icons/gi';
import type { LeaderboardTableProps } from './types';
import translations from '../../locales/cs/dashboard.leaderboard.json';

const getTrophyColor = (rank: number): string => {
  switch (rank) {
    case 0:
      return '#FFD700'; // Gold
    case 1:
      return '#C0C0C0'; // Silver
    case 2:
      return '#CD7F32'; // Bronze
    default:
      return 'transparent';
  }
};

export const LeaderboardTable = ({ participants = [], title }: LeaderboardTableProps) => (
  <Paper 
    elevation={1}
    sx={{ 
      p: 3,
      height: '100%',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
    }}
  >
    <Box display="flex" alignItems="center" gap={2} mb={3}>
      <GiTrophy style={{ fontSize: '1.5rem', color: 'primary.main' }} />
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        {title}
      </Typography>
    </Box>

    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '10px 16px' }}>
            <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500 }}>
              {translations.table.columns.rank}
            </Typography>
          </th>
          <th style={{ textAlign: 'left', padding: '10px 16px' }}>
            <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500 }}>
              {translations.table.columns.name}
            </Typography>
          </th>
          <th style={{ textAlign: 'right', padding: '10px 16px' }}>
            <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 500 }}>
              {translations.table.columns.beers}
            </Typography>
          </th>
        </tr>
      </thead>
      <tbody>
        {participants.map((participant, index) => (
          <tr key={participant.id}>
            <td style={{ padding: '10px 16px', width: '70px' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography 
                  variant={index < 3 ? 'h6' : 'body1'} 
                  sx={{ 
                    fontWeight: 'bold',
                    color: index < 3 ? 'text.primary' : 'text.secondary'
                  }}
                >
                  {index + 1}.
                </Typography>
                {index < 3 && (
                  <GiTrophy style={{ 
                    fontSize: '1.2rem',
                    color: getTrophyColor(index)
                  }} />
                )}
              </Box>
            </td>
            <td style={{ padding: '10px 16px' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography 
                  variant={index < 3 ? 'h6' : 'body1'}
                  sx={{ fontWeight: index < 3 ? 'bold' : 'normal' }}
                >
                  {participant.username}
                </Typography>
                {index === 0 && (
                  <Chip 
                    label={translations.table.champion}
                    size="small"
                    sx={{ 
                      bgcolor: 'warning.light',
                      color: 'warning.dark',
                      fontWeight: 'bold',
                      fontSize: '0.75rem'
                    }}
                  />
                )}
              </Box>
            </td>
            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
              <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                <Typography 
                  variant={index < 3 ? 'h6' : 'body1'}
                  sx={{ 
                    fontWeight: 'bold',
                    color: index < 3 ? 'error.main' : 'text.primary'
                  }}
                >
                  {participant.beerCount}
                </Typography>
                <FaBeer style={{ 
                  fontSize: index < 3 ? '1.1rem' : '1rem',
                  opacity: index < 3 ? 1 : 0.6,
                  color: index < 3 ? 'error.main' : 'text.secondary',
                }} />
              </Box>
            </td>
          </tr>
        ))}
        {(!participants || participants.length === 0) && (
          <tr>
            <td colSpan={3} style={{ textAlign: 'center', padding: '40px 16px' }}>
              <Typography color="text.secondary">
                {translations.table.noParticipants}
              </Typography>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </Paper>
); 