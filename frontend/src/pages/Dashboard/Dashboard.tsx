import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Avatar,
} from '@mui/material';
import {
    LocalBar as BeerIcon,
    EmojiEvents as TrophyIcon,
    Group as GroupIcon,
    Timer as TimeIcon,
    TrendingUp as TrendIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventService } from '../../services/eventService';
import { barrelService } from '../../services/barrelService';
import { dashboardService } from '../../services/dashboardService';
import type { Event } from '../../types/event';
import type { Barrel } from '../../types/barrel';
import type { DashboardStats } from '../../types/dashboard';
import translations from '../../locales/cs/dashboard.json';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../types/featureFlags';
import { EventSelector } from '../../components/EventSelector';
import { EmptyEventState } from '../../components/EmptyEventState';

export const Dashboard: React.FC = () => {
    const { selectedEvent } = useSelectedEvent();
    const showEventHistory = useFeatureFlag(FeatureFlagKey.SHOW_EVENT_HISTORY);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEvent, setActiveEvent] = useState<Event | null>(null);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
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
            setBarrels(barrelsData);
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

    if (isLoading) {
        return (
            <Container>
                <Box sx={{ width: '100%', mt: 4 }}>
                    <LinearProgress />
                    <Typography align="center" sx={{ mt: 2 }}>{translations.loading}</Typography>
                </Box>
            </Container>
        );
    }

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

    return (
        <div>
            {/* Header with Event Selector */}
            <Box display="flex" alignItems="center" gap={2} mb={4}>
                {showEventHistory && <EventSelector />}
            </Box>

            {/* Event Info Header */}
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    mb: 4,
                    background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography variant="h3" fontWeight="bold" gutterBottom>
                        {activeEvent.name}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
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

            <Grid container spacing={4}>
                {/* Beer Keg Visualization */}
                <Grid item xs={12} md={6}>
                    <Card 
                        sx={{ 
                            p: 3, 
                            height: '100%', 
                            position: 'relative',
                            transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: (theme) => theme.shadows[8],
                            },
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {translations.barrelStatus.title}
                        </Typography>
                        <Box sx={{ 
                            position: 'relative', 
                            height: 400,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Keg Container */}
                            <Box sx={{ 
                                position: 'relative', 
                                width: '60%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {/* Keg Body */}
                                <Box sx={{
                                    position: 'relative',
                                    width: '100%',
                                    height: '80%',
                                    bgcolor: '#e0e0e0',
                                    borderRadius: '40px',
                                    overflow: 'hidden',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: '5%',
                                        left: '10%',
                                        right: '10%',
                                        bottom: '5%',
                                        borderLeft: '8px solid #d0d0d0',
                                        borderRight: '8px solid #d0d0d0',
                                        borderRadius: 'inherit',
                                    }
                                }}>
                                    {/* Beer Fill */}
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${(stats.remainingBeers / (stats.activeBarrels * 60)) * 100}%`,
                                        background: 'linear-gradient(180deg, #ffd700 0%, #ffa000 100%)',
                                        transition: 'height 1s ease-in-out',
                                    }} />

                                    {/* Foam Layer */}
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: `${(stats.remainingBeers / (stats.activeBarrels * 60)) * 100}%`,
                                        left: 0,
                                        width: '100%',
                                        height: '20px',
                                        background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.5) 100%)',
                                        animation: 'foamWave 2s ease-in-out infinite',
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            top: '-10px',
                                            left: 0,
                                            width: '100%',
                                            height: '10px',
                                            background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.8) 100%)',
                                            borderRadius: '50%',
                                        }
                                    }} />

                                    {/* Keg Rings */}
                                    {[20, 40, 60, 80].map((position) => (
                                        <Box
                                            key={position}
                                            sx={{
                                                position: 'absolute',
                                                top: `${position}%`,
                                                left: '-5%',
                                                width: '110%',
                                                height: '12px',
                                                bgcolor: '#d0d0d0',
                                                transform: 'translateY(-50%)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                '&::after': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: '50%',
                                                    background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
                                                }
                                            }}
                                        />
                                    ))}

                                    {/* Tap */}
                                    <Box sx={{
                                        position: 'absolute',
                                        top: '30%',
                                        right: '-20px',
                                        width: '40px',
                                        height: '20px',
                                        bgcolor: '#b0b0b0',
                                        borderRadius: '4px',
                                        boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                                    }} />
                                </Box>

                                {/* Stats Overlay */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                    p: 2,
                                    borderRadius: 2,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                }}>
                                    <Typography variant="h3" fontWeight="bold" color="primary">
                                        {Math.round(stats.remainingBeers)}
                                    </Typography>
                                    <Typography variant="subtitle1" color="textSecondary">
                                        {translations.barrelStatus.remainingBeers}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Stats Footer */}
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ 
                                        textAlign: 'center',
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'primary.light',
                                    }}>
                                        <Typography variant="h5" color="primary" fontWeight="bold">
                                            {stats.activeBarrels}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {translations.barrelStatus.activeBarrels}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ 
                                        textAlign: 'center',
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: 'grey.100',
                                    }}>
                                        <Typography variant="h5" color="text.primary" fontWeight="bold">
                                            {barrels.length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {translations.barrelStatus.totalBarrels}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>

                {/* Stats and Tables */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={3}>
                        {/* Top Drinker Card */}
                        <Grid item xs={12}>
                            <Card 
                                sx={{ 
                                    p: 3,
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: (theme) => theme.shadows[8],
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Box sx={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: '50%',
                                        bgcolor: 'warning.light',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <TrophyIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="overline" color="textSecondary" sx={{ letterSpacing: 1 }}>
                                            {translations.stats.topDrinker}
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                                            {stats.topDrinker.username || translations.overview.charts.topUsers.unknownUser}
                                        </Typography>
                                        <Box sx={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: 1,
                                            bgcolor: 'warning.light',
                                            color: 'warning.main',
                                            py: 1,
                                            px: 2,
                                            borderRadius: 2,
                                            fontWeight: 'bold'
                                        }}>
                                            <FaBeer size={20} />
                                            <Typography variant="h6" component="span">
                                                {stats.topDrinker.count} {translations.stats.beers}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Stats Cards */}
                        <Grid item xs={12} sm={6}>
                            <Card 
                                sx={{ 
                                    p: 3, 
                                    height: '100%',
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: (theme) => theme.shadows[8],
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{ 
                                            p: 1.5, 
                                            borderRadius: 2, 
                                            bgcolor: 'primary.light',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <BeerIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                                        </Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {stats.totalBeers}
                                        </Typography>
                                    </Box>
                                    <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 'auto' }}>
                                        {translations.stats.totalBeers}
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Card 
                                sx={{ 
                                    p: 3, 
                                    height: '100%',
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: (theme) => theme.shadows[8],
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Box sx={{ 
                                            p: 1.5, 
                                            borderRadius: 2, 
                                            bgcolor: 'success.light',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <TrendIcon sx={{ fontSize: 30, color: 'success.main' }} />
                                        </Box>
                                        <Typography variant="h4" fontWeight="bold">
                                            {stats.averageBeersPerHour.toFixed(1)}
                                        </Typography>
                                    </Box>
                                    <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 'auto' }}>
                                        {translations.stats.averagePerHour}
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Top Users Table */}
                        <Grid item xs={12}>
                            <Card 
                                sx={{ 
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: (theme) => theme.shadows[8],
                                    },
                                }}
                            >
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        {translations.overview.charts.topUsers.title}
                                    </Typography>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    {translations.overview.charts.topUsers.columns.name}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {translations.overview.charts.topUsers.columns.beers}
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dashboardStats.topUsers.map((user, index) => (
                                                <TableRow 
                                                    key={user.id}
                                                    sx={{
                                                        transition: 'background-color 0.2s ease-in-out',
                                                        '&:hover': {
                                                            bgcolor: 'action.hover',
                                                        },
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Avatar 
                                                                sx={{ 
                                                                    mr: 2,
                                                                    bgcolor: index === 0 ? 'warning.main' : 'primary.main',
                                                                }}
                                                            >
                                                                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography fontWeight={index === 0 ? 'bold' : 'regular'}>
                                                                    {user.username || translations.overview.charts.topUsers.unknownUser}
                                                                </Typography>
                                                                {index === 0 && (
                                                                    <Typography variant="caption" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <TrophyIcon sx={{ fontSize: 16 }} />
                                                                        {translations.stats.topDrinker}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            bgcolor: index === 0 ? 'warning.light' : 'primary.light',
                                                            color: index === 0 ? 'warning.main' : 'primary.main',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            borderRadius: 1,
                                                            fontWeight: 'bold'
                                                        }}>
                                                            <FaBeer />
                                                            {user.beerCount}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Barrel Stats Table */}
                        <Grid item xs={12}>
                            <Card 
                                sx={{ 
                                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: (theme) => theme.shadows[8],
                                    },
                                }}
                            >
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        {translations.overview.charts.barrelStats.title}
                                    </Typography>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>
                                                    {translations.overview.charts.barrelStats.columns.size}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {translations.overview.charts.barrelStats.columns.count}
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {dashboardStats.barrelStats.map((stat, index) => (
                                                <TableRow 
                                                    key={index}
                                                    sx={{
                                                        transition: 'background-color 0.2s ease-in-out',
                                                        '&:hover': {
                                                            bgcolor: 'action.hover',
                                                        },
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Box sx={{ 
                                                                width: 32, 
                                                                height: 32, 
                                                                borderRadius: 1,
                                                                bgcolor: 'primary.light',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'primary.main',
                                                                fontWeight: 'bold'
                                                            }}>
                                                                {stat.size}
                                                            </Box>
                                                            <Typography>litrů</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Box sx={{ 
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 1,
                                                            bgcolor: 'primary.light',
                                                            color: 'primary.main',
                                                            py: 0.5,
                                                            px: 1.5,
                                                            borderRadius: 1,
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {stat.count} ks
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Card>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </div>
    );
}; 