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
import { eventService } from '../services/eventService';
import { dashboardService } from '../services/dashboardService';
import type { Event } from '../types/event';
import type { LeaderboardData, UserLeaderboardData } from '../types/leaderboard';
import { toast } from 'react-hot-toast';
import { usePageTitle } from '../hooks/usePageTitle';
import { MetricCard } from '../components/ui/MetricCard';

export const EventResults: React.FC = () => {
    usePageTitle('Výsledky události');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
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

    const renderLeaderboardSection = (users: UserLeaderboardData[], title: string, bgColor: string) => {
        return (
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 3, bgcolor: bgColor, color: 'white' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon /> {title}
                    </Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                    {users && users.length > 0 ? (
                        users.slice(0, 10).map((user, index) => (
                            <Box
                                key={user.id}
                                sx={{
                                    p: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    mb: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    bgcolor: index < 3 ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
                                }}
                            >
                                <Box sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    bgcolor: index < 3 ? 'warning.main' : 'grey.300',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}>
                                    {getMedalIcon(index + 1)}
                                </Box>
                                <Box flex={1}>
                                    <Typography fontWeight="bold">
                                        {user.username}
                                    </Typography>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <BeerIcon sx={{ fontSize: '1rem', opacity: 0.5 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {user.beerCount} piv
                                        </Typography>
                                    </Box>
                                </Box>
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
        <Box>
            {/* Hero Section */}
            <Box 
                sx={{ 
                    bgcolor: 'success.main',
                    color: 'white',
                    pt: 8,
                    pb: 20,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ maxWidth: 1200, mx: 'auto', px: 4 }}>
                    {/* Back Button */}
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate(`/events/${id}`)}
                        sx={{ 
                            color: 'white',
                            opacity: 0.8,
                            '&:hover': { opacity: 1 },
                            mb: 4,
                            textTransform: 'none',
                            pl: 0,
                        }}
                    >
                        Zpět na událost
                    </Button>

                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
                            <TrophyIcon sx={{ fontSize: 48 }} />
                            <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                                Výsledky události
                            </Typography>
                        </Box>
                        
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {event.name}
                        </Typography>

                        {event.endDate && (
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                Ukončeno: {format(new Date(event.endDate), 'PPp', { locale: cs })}
                            </Typography>
                        )}
                    </Box>
                </Box>

                {/* Background Pattern */}
                <Box
                    sx={{
                        position: 'absolute',
                        right: -100,
                        bottom: -100,
                        width: 600,
                        height: 600,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                />
            </Box>

            {/* Content Section */}
            <Box 
                sx={{ 
                    maxWidth: 1200, 
                    mx: 'auto',
                    px: 4,
                    transform: 'translateY(-100px)',
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
                <Paper elevation={2} sx={{ borderRadius: 2, mb: 4, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, bgcolor: 'success.light', color: 'white' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <StarIcon /> Zajímavé statistiky
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center', p: 2 }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        🏆 Největší pijan
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                        {topDrinker?.username || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {topDrinker?.beerCount || 0} piv
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center', p: 2 }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        ⚡ Nejpilnější hodina
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                                        {mostActiveHour}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Nejvíce piv za hodinu
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Box sx={{ textAlign: 'center', p: 2 }}>
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        <SpeedIcon /> Rychlost pití
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                        {fastestDrinker?.username || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
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
                        {renderLeaderboardSection(leaderboard?.males || [], 'Muži', 'primary.main')}
                    </Grid>

                    {/* Women's Leaderboard */}
                    <Grid item xs={12} md={6}>
                        {renderLeaderboardSection(leaderboard?.females || [], 'Ženy', 'secondary.main')}
                    </Grid>
                </Grid>

                {/* Event Summary */}
                <Paper elevation={2} sx={{ borderRadius: 2, mt: 4, overflow: 'hidden' }}>
                    <Box sx={{ p: 3, bgcolor: 'grey.100' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            Shrnutí události
                        </Typography>
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body1" paragraph>
                                    <strong>Název:</strong> {event.name}
                                </Typography>
                                {event.description && (
                                    <Typography variant="body1" paragraph>
                                        <strong>Popis:</strong> {event.description}
                                    </Typography>
                                )}
                                <Typography variant="body1" paragraph>
                                    <strong>Začátek:</strong> {format(new Date(event.startDate), 'PPp', { locale: cs })}
                                </Typography>
                                {event.endDate && (
                                    <Typography variant="body1" paragraph>
                                        <strong>Konec:</strong> {format(new Date(event.endDate), 'PPp', { locale: cs })}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="body1" paragraph>
                                    <strong>Celkem piv:</strong> {totalBeers}
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    <strong>Účastníci:</strong> {totalParticipants}
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    <strong>Průměr na osobu:</strong> {averageBeersPerUser} piv
                                </Typography>
                                <Typography variant="body1" paragraph>
                                    <strong>Doba trvání:</strong> {event.endDate && event.startDate ? 
                                        Math.round((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60)) : 0} hodin
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};
