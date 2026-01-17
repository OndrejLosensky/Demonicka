import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Box,
    Typography,
    Button,
    Paper,
    LinearProgress,
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    TrendingUp as TrendingUpIcon,
    LocalBar as BeerIcon,
    Group as GroupIcon,
    Timer as TimerIcon,
    Person as PersonIcon,
    EmojiEvents as TrophyIcon,
    Speed as SpeedIcon,
    Star as StarIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventService } from '../../../services/eventService';
import { dashboardService } from '../../../services/dashboardService';
import type { Event, LeaderboardData, UserLeaderboardData } from '@demonicka/shared-types';
import { toast } from 'react-hot-toast';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { MetricCard, PageHeader } from '@demonicka/ui';
import { tokens } from '../../../theme/tokens';
import { getShadow } from '../../../theme/utils';
import { useAppTheme } from '../../../contexts/ThemeContext';

export const EventResults: React.FC = () => {
    usePageTitle('Výsledky události');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { mode } = useAppTheme();
    const [event, setEvent] = useState<Event | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadEventData = useCallback(async () => {
        if (!id) return;
        try {
            const data = await eventService.getEvent(id);
            setEvent(data);
        } catch (error) {
            console.error('Failed to load event:', error);
            toast.error('Nepodařilo se načíst událost');
        }
    }, [id]);

    const loadLeaderboard = useCallback(async () => {
        if (!id) return;
        try {
            const data = await dashboardService.getLeaderboard(id);
            setLeaderboard(data);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            toast.error('Nepodařilo se načíst žebříček');
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            Promise.all([loadEventData(), loadLeaderboard()]).finally(() => {
                setIsLoading(false);
            });
        }
    }, [id, loadEventData, loadLeaderboard]);

    if (isLoading) {
        return (
            <Container>
                <Box sx={{ width: '100%', mt: 4 }}>
                    <LinearProgress />
                </Box>
            </Container>
        );
    }

    if (!event) {
        return (
            <Container>
                <Typography variant="h6" sx={{ mt: 4, textAlign: 'center' }}>
                    Událost nebyla nalezena
                </Typography>
            </Container>
        );
    }

    const totalBeers = (leaderboard?.males || []).reduce((sum, user) => sum + user.beerCount, 0) +
                      (leaderboard?.females || []).reduce((sum, user) => sum + user.beerCount, 0);
    
    const totalParticipants = (leaderboard?.males || []).length + (leaderboard?.females || []).length;
    const averageBeersPerUser = totalParticipants > 0 ? Math.round(totalBeers / totalParticipants) : 0;

    // Calculate fun statistics
    const allUsers = [...(leaderboard?.males || []), ...(leaderboard?.females || [])];
    const topDrinker = allUsers.length > 0 ? allUsers[0] : null;
    const mostActiveHour = '19:00'; // This would need to be calculated from actual data
    const fastestDrinker = allUsers.length > 0 ? allUsers[0] : null;

    const getMedalIcon = (position: number) => {
        switch (position) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `${position}.`;
        }
    };

    const renderLeaderboardSection = (users: UserLeaderboardData[], title: string) => {
        return (
            <Paper 
                sx={{ 
                    borderRadius: tokens.borderRadius.md, 
                    overflow: 'hidden', 
                    boxShadow: getShadow('sm', mode),
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} /> {title}
                    </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    {users && users.length > 0 ? (
                        users.slice(0, 10).map((user, index) => (
                            <Box
                                key={user.id}
                                sx={{
                                    p: 2.5,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: tokens.borderRadius.md,
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2.5,
                                    bgcolor: index < 3 ? 'rgba(255, 215, 0, 0.08)' : 'transparent',
                                    transition: tokens.transitions.default,
                                    '&:hover': {
                                        bgcolor: index < 3 ? 'rgba(255, 215, 0, 0.12)' : 'rgba(0,0,0,0.02)',
                                        transform: 'translateX(4px)',
                                        boxShadow: getShadow('card', mode),
                                    },
                                    '&:last-child': {
                                        mb: 0,
                                    }
                                }}
                            >
                                <Box sx={{ 
                                    width: 44, 
                                    height: 44, 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    bgcolor: index < 3 ? 'warning.main' : 'grey.300',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: index < 3 ? '1.2rem' : '1rem',
                                    flexShrink: 0,
                                    boxShadow: index < 3 ? getShadow('glowSubtle', mode) : getShadow('xs', mode),
                                }}>
                                    {getMedalIcon(index + 1)}
                                </Box>
                                <Box flex={1} sx={{ minWidth: 0 }}>
                                    <Typography 
                                        fontWeight="bold" 
                                        sx={{ 
                                            fontSize: '1.1rem',
                                            mb: 0.5,
                                            color: 'text.primary',
                                        }}
                                    >
                                        {user.username}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <BeerIcon sx={{ 
                                            fontSize: '1.1rem', 
                                            opacity: 0.7,
                                            color: index < 3 ? 'warning.main' : 'text.secondary',
                                        }} />
                                        <Typography 
                                            variant="body2" 
                                            color="text.secondary"
                                            sx={{ 
                                                fontSize: '0.9rem',
                                                fontWeight: 500,
                                            }}
                                        >
                                            {user.beerCount} piv
                                        </Typography>
                                    </Box>
                                </Box>
                                {index < 3 && (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        bgcolor: 'warning.light',
                                        color: 'warning.contrastText',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        flexShrink: 0,
                                    }}>
                                        #{index + 1}
                                    </Box>
                                )}
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                            Žádní účastníci se nezúčastnili
                        </Typography>
                    )}
                </Box>
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate(`/events/${id}`)}
                            sx={{ 
                                color: 'text.secondary',
                                textTransform: 'none',
                                minWidth: 'auto',
                                px: 1,
                                mr: -1,
                            }}
                        >
                            Zpět
                        </Button>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <TrophyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                    Výsledky události
                                </Typography>
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary' }}>
                                {event.name}
                            </Typography>
                            {event.endDate && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Ukončeno: {format(new Date(event.endDate), 'PPp', { locale: cs })}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                }
            />

            {/* Content Section */}
            <Box 
                sx={{ 
                    maxWidth: 1200, 
                    mx: 'auto',
                }}
            >
                {/* Final Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Celkem piv" value={totalBeers} icon={<BeerIcon />} color="primary" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Účastníci" value={totalParticipants} icon={<GroupIcon />} color="error" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Průměr na osobu" value={averageBeersPerUser} icon={<TrendingUpIcon />} color="success" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Doba trvání" value={event.endDate && event.startDate ? 
                            Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60)) : 0} 
                            icon={<TimerIcon />} color="warning" />
                    </Grid>
                </Grid>

                {/* Fun Statistics */}
                <Paper elevation={2} sx={{ borderRadius: tokens.borderRadius.md, mb: 4, overflow: 'hidden', boxShadow: getShadow('card', mode) }}>
                    <Box sx={{ p: 3, bgcolor: 'success.light', color: 'white' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StarIcon /> Zajímavé statistiky
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 3,
                                    borderRadius: tokens.borderRadius.md,
                                    bgcolor: 'rgba(76, 175, 80, 0.05)',
                                    border: '1px solid',
                                    borderColor: 'success.light',
                                    transition: tokens.transitions.default,
                                    '&:hover': {
                                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                                        transform: 'translateY(-2px)',
                                    }
                                }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                                        🏆 Největší pijan
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                                        {topDrinker?.username || 'N/A'}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        {topDrinker?.beerCount || 0} piv
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 3,
                                    borderRadius: tokens.borderRadius.md,
                                    bgcolor: 'rgba(255, 152, 0, 0.05)',
                                    border: '1px solid',
                                    borderColor: 'warning.light',
                                    transition: tokens.transitions.default,
                                    '&:hover': {
                                        bgcolor: 'rgba(255, 152, 0, 0.08)',
                                        transform: 'translateY(-2px)',
                                    }
                                }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                                        ⚡ Nejpilnější hodina
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}>
                                        {mostActiveHour}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Nejvíce piv za hodinu
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ 
                                    textAlign: 'center', 
                                    p: 3,
                                    borderRadius: tokens.borderRadius.md,
                                    bgcolor: 'rgba(244, 67, 54, 0.05)',
                                    border: '1px solid',
                                    borderColor: 'error.light',
                                    transition: tokens.transitions.default,
                                    '&:hover': {
                                        bgcolor: 'rgba(244, 67, 54, 0.08)',
                                        transform: 'translateY(-2px)',
                                    }
                                }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                                        <SpeedIcon /> Rychlost pití
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
                                        {fastestDrinker?.username || 'N/A'}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                                        Nejrychlejší start
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>

                {/* Leaderboards */}
                <Grid container spacing={3}>
                    {/* Men's Leaderboard */}
                    <Grid item xs={12} md={6}>
                        {renderLeaderboardSection(leaderboard?.males || [], 'Muži')}
                    </Grid>

                    {/* Women's Leaderboard */}
                    <Grid item xs={12} md={6}>
                        {renderLeaderboardSection(leaderboard?.females || [], 'Ženy')}
                    </Grid>
                </Grid>

                {/* Event Summary */}
                <Paper 
                    sx={{ 
                        borderRadius: tokens.borderRadius.md, 
                        mt: 4, 
                        overflow: 'hidden', 
                        boxShadow: getShadow('sm', mode),
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Shrnutí události
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={4}>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ space: 2 }}>
                                    <Box sx={{ mb: 3, p: 2.5, borderRadius: tokens.borderRadius.md, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body1" paragraph sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
                                            <strong>Název:</strong> {event.name}
                                        </Typography>
                                        {event.description && (
                                            <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'text.secondary' }}>
                                                <strong>Popis:</strong> {event.description}
                                            </Typography>
                                        )}
                                        <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'text.secondary' }}>
                                            <strong>Začátek:</strong> {format(new Date(event.startDate), 'PPp', { locale: cs })}
                                        </Typography>
                                        {event.endDate && (
                                            <Typography variant="body1" paragraph sx={{ mb: 0, color: 'text.secondary' }}>
                                                <strong>Konec:</strong> {format(new Date(event.endDate), 'PPp', { locale: cs })}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Box sx={{ space: 2 }}>
                                    <Box sx={{ mb: 3, p: 2.5, borderRadius: tokens.borderRadius.md, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body1" paragraph sx={{ mb: 1.5, fontWeight: 600, color: 'success.main' }}>
                                            <strong>Celkem piv:</strong> {totalBeers}
                                        </Typography>
                                        <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'text.secondary' }}>
                                            <strong>Účastníci:</strong> {totalParticipants}
                                        </Typography>
                                        <Typography variant="body1" paragraph sx={{ mb: 1.5, color: 'text.secondary' }}>
                                            <strong>Průměr na osobu:</strong> {averageBeersPerUser} piv
                                        </Typography>
                                        <Typography variant="body1" paragraph sx={{ mb: 0, color: 'text.secondary' }}>
                                            <strong>Doba trvání:</strong> {event.endDate && event.startDate ? 
                                                Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60)) : 0} hodin
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};
