import { Paper, Typography, Box, Chip, Divider } from '@mui/material';
import { FaBeer } from 'react-icons/fa';
import { GiTrophy } from 'react-icons/gi';
import type { LeaderboardTableProps } from './types';
import translations from '../../../locales/cs/dashboard.leaderboard.json';
import type { UserLeaderboard } from './types';

const getTrophyColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return '#FFD700'; // Gold
    case 2:
      return '#C0C0C0'; // Silver
    case 3:
      return '#CD7F32'; // Bronze
    default:
      return 'transparent';
  }
};

export const LeaderboardTable = ({ participants = [], title }: LeaderboardTableProps) => {
  // Group participants by rank (shared positions)
  const groupedByRank = participants.reduce((acc, participant) => {
    const rank = participant.rank;
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(participant);
    return acc;
  }, {} as Record<number, UserLeaderboard[]>);

  // Convert to sorted array of rank groups
  const rankGroups = Object.entries(groupedByRank)
    .map(([rank, group]) => ({ rank: parseInt(rank, 10), participants: group }))
    .sort((a, b) => a.rank - b.rank);

  // Get max beers for progress bar calculation
  const maxBeers = rankGroups.length > 0 && rankGroups[0].participants.length > 0 
    ? rankGroups[0].participants[0].beerCount 
    : 1;

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <GiTrophy style={{ fontSize: '1.5rem', color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.3rem', textShadow: 'none' }}>
          {title}
        </Typography>
      </Box>

      {rankGroups.length === 0 ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary" variant="body1" sx={{ fontWeight: 500, fontSize: '1rem', textShadow: 'none' }}>
            {translations.table.noParticipants}
          </Typography>
        </Box>
      ) : (
        <Box>
          {/* Table Header */}
          <Box 
            display="flex" 
            sx={{ 
              px: 2, 
              py: 1.5, 
              borderBottom: '1px solid',
              borderColor: 'divider',
              mb: 1
            }}
          >
            <Box sx={{ width: '100px', flexShrink: 0 }}>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', textShadow: 'none' }}>
                {translations.table.columns.rank}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', textShadow: 'none' }}>
                {translations.table.columns.name}
              </Typography>
            </Box>
            <Box sx={{ width: '140px', textAlign: 'right', flexShrink: 0 }}>
              <Typography color="text.secondary" variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', textShadow: 'none' }}>
                {translations.table.columns.beers}
              </Typography>
            </Box>
          </Box>

          {/* Rank Groups */}
          {rankGroups.map(({ rank, participants: groupParticipants }, groupIndex) => {
            const isTopThree = rank <= 3;
            const isShared = groupParticipants.length > 1;

            return (
              <Box key={rank}>
                {groupParticipants.map((participant, participantIndex) => (
                  <Box key={participant.id}>
                    <Box 
                      display="flex" 
                      alignItems="center"
                      sx={{ 
                        px: 2,
                        py: 1.5,
                        position: 'relative',
                        transition: 'all 0.2s ease',
                        ...(rank === 1 && {
                          background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.12) 0%, rgba(255, 215, 0, 0.03) 100%)',
                          borderLeft: '4px solid #FFD700',
                          '&:hover': {
                            background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.18) 0%, rgba(255, 215, 0, 0.06) 100%)',
                            transform: 'translateX(2px)',
                          }
                        }),
                        ...(rank === 2 && {
                          background: 'linear-gradient(90deg, rgba(192, 192, 192, 0.12) 0%, rgba(192, 192, 192, 0.03) 100%)',
                          borderLeft: '4px solid #C0C0C0',
                          '&:hover': {
                            background: 'linear-gradient(90deg, rgba(192, 192, 192, 0.18) 0%, rgba(192, 192, 192, 0.06) 100%)',
                            transform: 'translateX(2px)',
                          }
                        }),
                        ...(rank === 3 && {
                          background: 'linear-gradient(90deg, rgba(205, 127, 50, 0.12) 0%, rgba(205, 127, 50, 0.03) 100%)',
                          borderLeft: '4px solid #CD7F32',
                          '&:hover': {
                            background: 'linear-gradient(90deg, rgba(205, 127, 50, 0.18) 0%, rgba(205, 127, 50, 0.06) 100%)',
                            transform: 'translateX(2px)',
                          }
                        }),
                        ...(!isTopThree && {
                          '&:hover': {
                            bgcolor: 'action.hover',
                            transform: 'translateX(2px)',
                          }
                        }),
                      }}
                    >
                      {/* Rank Column */}
                      <Box sx={{ width: '100px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {participantIndex === 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isTopThree ? (
                              <>
                                <Box sx={{
                                  width: rank === 1 ? 44 : rank === 2 ? 40 : 36,
                                  height: rank === 1 ? 44 : rank === 2 ? 40 : 36,
                                  borderRadius: '50%',
                                  bgcolor: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32',
                                  color: '#000',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: rank === 1 ? '1.2rem' : rank === 2 ? '1.1rem' : '1rem',
                                  border: rank === 1 ? '2px solid rgba(255, 215, 0, 0.3)' : 
                                          rank === 2 ? '2px solid rgba(192, 192, 192, 0.3)' : 
                                          '2px solid rgba(205, 127, 50, 0.3)',
                                  boxShadow: rank === 1 ? '0 2px 8px rgba(255, 215, 0, 0.3)' : 
                                              rank === 2 ? '0 2px 8px rgba(192, 192, 192, 0.3)' : 
                                              '0 2px 8px rgba(205, 127, 50, 0.3)',
                                }}>
                                  {rank}
                                </Box>
                                <GiTrophy style={{ 
                                  fontSize: rank === 1 ? '1.8rem' : rank === 2 ? '1.5rem' : '1.3rem',
                                  color: getTrophyColor(rank),
                                  filter: rank === 1 ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' : 
                                          rank === 2 ? 'drop-shadow(0 0 6px rgba(192, 192, 192, 0.4))' : 
                                          'drop-shadow(0 0 6px rgba(205, 127, 50, 0.4))',
                                }} />
                              </>
                            ) : (
                              <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                              }}>
                                {rank}
                              </Box>
                            )}
                          </Box>
                        )}
                        {isShared && participantIndex > 0 && (
                          <Box sx={{ width: '24px', height: '1px', bgcolor: 'divider' }} />
                        )}
                      </Box>

                      {/* Name Column */}
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant={isTopThree ? 'h6' : 'body1'}
                          sx={{ 
                            fontWeight: isTopThree ? 700 : 600,
                            fontSize: isTopThree ? '1.1rem' : '1rem',
                            color: 'text.primary',
                            textShadow: 'none',
                          }}
                        >
                          {participant.username}
                        </Typography>
                        {participant.rank === 1 && participantIndex === 0 && (
                          <Chip 
                            label={translations.table.champion}
                            size="small"
                            sx={{ 
                              bgcolor: 'warning.main',
                              color: 'warning.contrastText',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              height: '20px',
                              px: 0.8,
                              borderRadius: 1,
                              boxShadow: 'none',
                            }}
                          />
                        )}
                      </Box>

                      {/* Beers Column */}
                      <Box sx={{ 
                        width: '140px', 
                        textAlign: 'right', 
                        flexShrink: 0, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end', 
                        gap: 1.5 
                      }}>
                        {/* Progress Bar */}
                        <Box sx={{ 
                          width: '60px', 
                          height: '6px', 
                          bgcolor: 'divider', 
                          borderRadius: 3, 
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          <Box sx={{ 
                            width: `${(participant.beerCount / maxBeers) * 100}%`, 
                            height: '100%', 
                            bgcolor: isTopThree ? getTrophyColor(rank) : 'primary.main',
                            transition: 'width 0.3s ease',
                            borderRadius: 3,
                          }} />
                        </Box>
                        <Typography 
                          variant={isTopThree ? 'h6' : 'body1'}
                          sx={{ 
                            fontWeight: 700,
                            fontSize: isTopThree ? '1.1rem' : '1rem',
                            color: 'text.primary',
                            textShadow: 'none',
                            minWidth: '30px',
                          }}
                        >
                          {participant.beerCount}
                        </Typography>
                        <FaBeer style={{ 
                          fontSize: isTopThree ? '1rem' : '0.9rem',
                          opacity: isTopThree ? 1 : 0.7,
                          color: isTopThree ? getTrophyColor(rank) : 'text.secondary',
                        }} />
                      </Box>
                    </Box>
                    
                    {/* Divider between participants in same rank (except last one) */}
                    {isShared && participantIndex < groupParticipants.length - 1 && (
                      <Divider sx={{ mx: 2, borderColor: 'divider' }} />
                    )}
                  </Box>
                ))}

                {/* Divider after rank group (except last group) */}
                {groupIndex < rankGroups.length - 1 && (
                  <Divider sx={{ my: 1, borderColor: 'divider' }} />
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};
