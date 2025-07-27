import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    Avatar,
    Chip,
} from '@mui/material';
import {
    LocalBar as BeerIcon,
    Group as GroupIcon,
    Timer as TimeIcon,
    TrendingUp as TrendIcon,
    ShowChart as ChartIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventService } from '../../services/eventService';
import { barrelService } from '../../services/barrelService';
import { dashboardService } from '../../services/dashboardService';
import type { Event } from '../../types/event';
import type { DashboardStats } from '../../types/dashboard';
import translations from '../../locales/cs/dashboard.json';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../types/featureFlags';
import { EventSelector } from '../../components/EventSelector';
import { EmptyEventState } from '../../components/EmptyEventState';
import { PageLoader } from '../../components/ui/PageLoader';

export const Dashboard: React.FC = () => {
    const { selectedEvent } = useSelectedEvent();
    const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
        totalBeers: 0,
        totalUsers: 0,
        totalBarrels: 0,
        averageBeersPerUser: 0,
        topUsers: [],
        barrelStats: [],
    });
    const [stats, setStats] = useState({
        totalBeers: 0,
        activeBarrels: 0,
        remainingBeers: 0,
        topDrinker: { username: null as string | null, count: 0 },
        averageBeersPerHour: 0,
        participantsCount: 0,
        eventDuration: '',
    });

    useEffect(() => {
        loadData();
    }, [selectedEvent?.id]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [eventData, barrelsData, dashboardData] = await Promise.all([
                eventService.getActiveEvent(),
                barrelService.getAll(),
                dashboardService.getDashboardStats(selectedEvent?.id),
            ]);

            setActiveEvent(eventData);
            setDashboardStats(dashboardData);

            if (eventData) {
                const activeBarrels = barrelsData.filter(b => b.isActive).length;
                const remainingBeers = barrelsData.reduce((sum, barrel) => {
                    if (!barrel.isActive) return sum + barrel.remainingBeers;
                    return sum + barrel.remainingBeers;
                }, 0);

                const eventStart = new Date(eventData.startDate);
                const now = new Date();
                const hoursSinceStart = Math.max(1, (now.getTime() - eventStart.getTime()) / (1000 * 60 * 60));
                
                setStats({
                    totalBeers: dashboardData.totalBeers,
                    activeBarrels,
                    remainingBeers,
                    topDrinker: dashboardData.topUsers[0] ? 
                        { username: dashboardData.topUsers[0].username, count: dashboardData.topUsers[0].beerCount } : 
                        { username: null, count: 0 },
                    averageBeersPerHour: dashboardData.totalBeers / hoursSinceStart,
                    participantsCount: dashboardData.totalUsers,
                    eventDuration: format(eventStart, 'PPp', { locale: cs }),
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!activeEvent) {
        return (
            <Container>
                <EmptyEventState
                    title={translations.noActiveEvent.title}
                    subtitle={translations.noActiveEvent.subtitle}
                />
            </Container>
        );
    }

    if (isLoading) {
        return <PageLoader message="Načítání dashboardu..." />;
    }

    return (
        <Box p={3}>
            {/* Event Header Card */}
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    mb: 4,
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    color: 'white',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {showEventHistory && <EventSelector />}
                    </Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {activeEvent.name}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 3 }}>
                        {activeEvent.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, color: 'rgba(255, 255, 255, 0.9)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon />
                            <Typography>{stats.eventDuration}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon />
                            <Typography>{stats.participantsCount} {translations.stats.participants}</Typography>
                        </Box>
                    </Box>
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        right: -100,
                        bottom: -100,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                    }}
                />
            </Paper>

            {/* Statistics Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <BeerIcon sx={{ color: '#6366F1' }} />
                            </Box>
                            <Typography color="text.secondary">{translations.stats.totalBeers}</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {stats.totalBeers}
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#FEF2F2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <ChartIcon sx={{ color: '#DC2626' }} />
                            </Box>
                            <Typography color="text.secondary">{translations.stats.averagePerHour}</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {stats.averageBeersPerHour.toFixed(1)}
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#F0FDF4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <TrendIcon sx={{ color: '#16A34A' }} />
                            </Box>
                            <Typography color="text.secondary">{translations.barrelStatus.remainingBeers}</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {stats.remainingBeers}
                        </Typography>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#FEF3C7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <GroupIcon sx={{ color: '#D97706' }} />
                            </Box>
                            <Typography color="text.secondary">{translations.stats.totalParticipants}</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {stats.participantsCount}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Top Users */}
            <Card sx={{ borderRadius: 2 }}>
                <Box p={3}>
                    <Typography variant="h6" fontWeight="bold" mb={3}>
                        {translations.overview.charts.topUsers.title}
                    </Typography>
                    <Grid container spacing={2}>
                        {dashboardStats.topUsers.map((user, index) => (
                            <Grid item xs={12} sm={6} md={4} key={user.id}>
                                <Box
                                    sx={{
                                        p: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: index === 0 ? '#FEF3C7' : '#F3F4F6' }}>
                                        {user.username.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box flex={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Typography fontWeight="bold">
                                                {user.username}
                                            </Typography>
                                            {index === 0 && (
                                                <Chip
                                                    label={translations.stats.topDrinker}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'warning.light',
                                                        color: 'warning.dark',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.75rem',
                                                    }}
                                                />
                                            )}
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <FaBeer style={{ fontSize: '1rem', opacity: 0.5 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                {user.beerCount} {translations.stats.beers}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Card>
        </Box>
    );
}; 