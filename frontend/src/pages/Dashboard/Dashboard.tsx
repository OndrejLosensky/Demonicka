import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Card,
    LinearProgress,
    useTheme,
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
    const theme = useTheme();
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

    const getBarrelFillPercentage = (): number => {
        if (!barrels.length) return 0;
        const totalCapacity = barrels.reduce((sum, barrel) => sum + (barrel.size * 8), 0);
        return (stats.remainingBeers / totalCapacity) * 100;
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
                <Typography variant="h4">
                    {translations.overview.title}
                </Typography>
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
                {/* Barrel Visualization */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ p: 3, height: '100%', position: 'relative' }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {translations.barrelStatus.title}
                        </Typography>
                        <Box sx={{ 
                            position: 'relative', 
                            height: 400,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Box sx={{ position: 'relative', width: '100%', maxWidth: 300 }}>
                                {/* Barrel Shape */}
                                <Box sx={{
                                    position: 'relative',
                                    width: '100%',
                                    paddingBottom: '150%',
                                    backgroundColor: theme.palette.grey[200],
                                    borderRadius: '20px',
                                    overflow: 'hidden',
                                }}>
                                    {/* Beer Fill */}
                                    <Box sx={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${getBarrelFillPercentage()}%`,
                                        background: 'linear-gradient(180deg, #ffc107 0%, #ff9800 100%)',
                                        transition: 'height 1s ease-in-out',
                                    }} />
                                    
                                    {/* Barrel Overlay */}
                                    <Box sx={{
                                        position: 'absolute',
                                        top: '5%',
                                        left: '10%',
                                        width: '80%',
                                        height: '90%',
                                        borderLeft: `4px solid ${theme.palette.grey[300]}`,
                                        borderRight: `4px solid ${theme.palette.grey[300]}`,
                                        borderRadius: '20px',
                                    }} />
                                    
                                    {/* Barrel Rings */}
                                    {[20, 40, 60, 80].map((position) => (
                                        <Box
                                            key={position}
                                            sx={{
                                                position: 'absolute',
                                                top: `${position}%`,
                                                left: 0,
                                                width: '100%',
                                                height: '4px',
                                                backgroundColor: theme.palette.grey[300],
                                                transform: 'translateY(-50%)',
                                            }}
                                        />
                                    ))}
                                </Box>

                                {/* Stats Overlay */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center',
                                    zIndex: 1,
                                }}>
                                    <Typography variant="h4" fontWeight="bold" color="primary">
                                        {Math.round(stats.remainingBeers)}
                                    </Typography>
                                    <Typography variant="body1" color="textSecondary">
                                        {translations.barrelStatus.remainingBeers}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
                                            {stats.activeBarrels}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {translations.barrelStatus.activeBarrels}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" color="primary">
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
                            <Card sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <TrophyIcon sx={{ fontSize: 40, color: theme.palette.warning.main }} />
                                    <Box>
                                        <Typography variant="overline" color="textSecondary">
                                            {translations.stats.topDrinker}
                                        </Typography>
                                        <Typography variant="h5" fontWeight="bold">
                                            {stats.topDrinker.username || translations.overview.charts.topUsers.unknownUser}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <FaBeer style={{ color: theme.palette.primary.main }} />
                                            <Typography>
                                                {stats.topDrinker.count} {translations.stats.beers}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Stats Cards */}
                        <Grid item xs={12} sm={6}>
                            <Card sx={{ p: 3, height: '100%' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <BeerIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                                        <Typography variant="h6">
                                            {stats.totalBeers}
                                        </Typography>
                                    </Box>
                                    <Typography color="textSecondary">
                                        {translations.stats.totalBeers}
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Card sx={{ p: 3, height: '100%' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <TrendIcon sx={{ fontSize: 30, color: 'success.main' }} />
                                        <Typography variant="h6">
                                            {stats.averageBeersPerHour.toFixed(1)}
                                        </Typography>
                                    </Box>
                                    <Typography color="textSecondary">
                                        {translations.stats.averagePerHour}
                                    </Typography>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Top Users Table */}
                        <Grid item xs={12}>
                            <Card>
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>
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
                                            {dashboardStats.topUsers.map((user) => (
                                                <TableRow key={user.id}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Avatar sx={{ mr: 2 }}>
                                                                {user.username ? user.username.charAt(0).toUpperCase() : '?'}
                                                            </Avatar>
                                                            <Typography>{user.username || translations.overview.charts.topUsers.unknownUser}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">{user.beerCount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </Box>
                            </Card>
                        </Grid>

                        {/* Barrel Stats Table */}
                        <Grid item xs={12}>
                            <Card>
                                <Box sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom>
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
                                                <TableRow key={index}>
                                                    <TableCell>{stat.size}l</TableCell>
                                                    <TableCell align="right">{stat.count}</TableCell>
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