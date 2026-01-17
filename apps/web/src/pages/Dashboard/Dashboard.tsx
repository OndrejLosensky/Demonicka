import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    Avatar,
    Chip,
    Switch,
    FormControlLabel,
    LocalBar as BeerIcon,
    Group as GroupIcon,
    Storage as BarrelIcon,
    Speed as SpeedIcon,
    EmojiEvents as TrophyIcon,
    TrendingDown as TrendingDownIcon,
    AccessTime as AccessTimeIcon,
    PageHeader,
    MetricCard,
    PageLoader,
} from '@demonicka/ui';
import { FaTrophy, FaFire, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { cs } from 'date-fns/locale';
import { eventService } from '../../services/eventService';
import { barrelService } from '../../services/barrelService';
import { dashboardService } from '../../services/dashboardService';
import { ActiveBarrelGraph } from './Barrels/ActiveBarrelGraph';
import type { Event, DashboardStats, Barrel } from '@demonicka/shared-types';
import type { HourlyStats } from '../../types/hourlyStats';
import translations from '../../locales/cs/dashboard.json';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../types/featureFlags';
import { EventSelector } from '../../components/EventSelector';
import { EmptyEventState } from '../../components/EmptyEventState';
import { usePageTitle } from '../../hooks/usePageTitle';
import { websocketService } from '../../services/websocketService';
import { tokens } from '../../theme/tokens';

export const Dashboard: React.FC = () => {
    usePageTitle('Dashboard');
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
    const [hourlyStats, setHourlyStats] = useState<HourlyStats[]>([]);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
    const [stats, setStats] = useState({
        totalBeers: 0,
        activeBarrels: 0,
        remainingBeers: 0,
        topDrinker: { username: null as string | null, count: 0 },
        averageBeersPerHour: 0,
        participantsCount: 0,
        eventDuration: '',
        consumptionEfficiency: 0,
    });
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [useCustomDate, setUseCustomDate] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setIsLoading(true);
            
            // Prepare date parameter for hourly stats (always a specific day)
            const effectiveDate = useCustomDate && selectedDate ? selectedDate : new Date();
            const dateParam = effectiveDate.toISOString().split('T')[0];
            
            const [eventData, barrelsData, dashboardData, hourlyData, leaderboard] = await Promise.all([
                eventService.getActiveEvent(),
                barrelService.getAll(),
                dashboardService.getDashboardStats(selectedEvent?.id),
                selectedEvent?.id ? dashboardService.getHourlyStats(selectedEvent.id, dateParam) : Promise.resolve([]),
                selectedEvent?.id ? dashboardService.getLeaderboard(selectedEvent.id) : Promise.resolve({ males: [], females: [] } as unknown as import('../../types/leaderboard').LeaderboardData),
            ]);

            setActiveEvent(eventData);
            setDashboardStats(dashboardData);
            setBarrels(barrelsData);
            // Normalize to 24 hours for the selected day
            const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
            for (const item of hourlyData) {
                if (item.hour >= 0 && item.hour < 24) {
                    hours[item.hour].count = item.count;
                }
            }
            setHourlyStats(hours);

            if (eventData) {
                const activeBarrels = barrelsData.filter(b => b.isActive).length;
                const remainingBeers = barrelsData.reduce((sum, barrel) => {
                    if (barrel.isActive) return sum + barrel.remainingBeers;
                    return sum;
                }, 0);

                // Daily average per hour from selected day (active hours only)
                const dailyTotalBeers = hours.reduce((sum, h) => sum + h.count, 0);
                const activeHours = hours.filter(h => h.count > 0).length || 1;
                const averagePerHour = dailyTotalBeers / activeHours;

                // Consumption efficiency across ALL barrels (consumed / capacity)
                const totalCapacity = barrelsData.reduce((sum, b) => sum + (b.totalBeers || 0), 0);
                const totalRemaining = barrelsData.reduce((sum, b) => sum + (b.remainingBeers || 0), 0);
                const consumptionEfficiency = totalCapacity > 0 ? ((totalCapacity - totalRemaining) / totalCapacity) * 100 : 0;

                const eventStart = new Date(eventData.startDate);
                
                // Corrected total from current participants only
                const correctedTotal = (leaderboard.males || leaderboard.females)
                  ? leaderboard.males.reduce((s: number, u: { beerCount: number }) => s + (u.beerCount || 0), 0) +
                    leaderboard.females.reduce((s: number, u: { beerCount: number }) => s + (u.beerCount || 0), 0)
                  : dashboardData.totalBeers;

                setStats({
                    totalBeers: correctedTotal,
                    activeBarrels,
                    remainingBeers,
                    topDrinker: dashboardData.topUsers[0] ? 
                        { username: dashboardData.topUsers[0].username, count: dashboardData.topUsers[0].beerCount } : 
                        { username: null, count: 0 },
                    averageBeersPerHour: averagePerHour,
                    participantsCount: dashboardData.totalUsers,
                    eventDuration: format(eventStart, 'PPp', { locale: cs }),
                    consumptionEfficiency,
                });
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedEvent?.id, selectedDate, useCustomDate]);

    useEffect(() => {
        loadData();
        
        // Subscribe to realtime dashboard updates
        const refreshHandler = () => {
            loadData();
        };
        
        // Subscribe to real-time dashboard stats updates
        const statsUpdateHandler = (data: { dashboard: any; public: any }) => {
            // Update dashboard stats immediately
            setDashboardStats(data.dashboard);
            
            // Update the stats object with new data
            setStats(prevStats => {
                return {
                    ...prevStats,
                    totalBeers: data.public.totalBeers,
                    participantsCount: data.public.totalUsers,
                    // Calculate average beers per person from the new data
                    averageBeersPerHour: prevStats.averageBeersPerHour, // Keep existing hourly average
                    // Keep other stats that might not be in the update
                };
            });
        };
        
        websocketService.subscribe('dashboard:update', refreshHandler);
        websocketService.subscribe('dashboard:stats:update', statsUpdateHandler);
        
        return () => {
            websocketService.unsubscribe('dashboard:update', refreshHandler);
            websocketService.unsubscribe('dashboard:stats:update', statsUpdateHandler);
        };
    }, [loadData]);

    // Join event room for real-time updates
    useEffect(() => {
        if (selectedEvent?.id) {
            websocketService.joinEvent(selectedEvent.id);
            
            return () => {
                websocketService.leaveEvent(selectedEvent.id);
            };
        }
    }, [selectedEvent?.id]);

    // Fallback refresh every 5 minutes in case WebSocket fails
    useEffect(() => {
        if (!selectedEvent?.id) return;

        const interval = setInterval(() => {
            loadData();
        }, 5 * 60 * 1000); // 5 minutes

        return () => {
            clearInterval(interval);
        };
    }, [selectedEvent?.id, loadData]);

    // Show loader first to avoid flashing the empty-state while data is loading
    if (isLoading) {
        return <PageLoader message="Načítání přehledu..." />;
    }

    // After loading completes, if there is still no active event, show the empty state
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

    // Get active barrel
    const activeBarrel = barrels.find(barrel => barrel.isActive);

    // Process hourly data
    const peakHour = hourlyStats.reduce((max, current) => 
        current.count > max.count ? current : max, 
        { hour: 0, count: 0 }
    );

    // Fun statistics
    const funStats = {
        fastestDrinker: dashboardStats.topUsers[0]?.username || 'Nikdo',
        mostActiveHour: peakHour.count > 0 ? `${peakHour.hour.toString().padStart(2, '0')}:00` : 'Žádná data',
        beersInPeakHour: peakHour.count,
        averagePerPerson: stats.participantsCount > 0 ? (stats.totalBeers / stats.participantsCount).toFixed(1) : '0',
        peakHourBeers: peakHour.count,
        efficiency: stats.remainingBeers > 0 ? ((stats.totalBeers / (stats.totalBeers + stats.remainingBeers)) * 100).toFixed(1) : '0',
    };

    return (
        <Box p={3}>
            {/* Header Section */}
            <PageHeader title={translations.title} left={showEventHistory ? <EventSelector /> : null} />

            {/* Main Statistics Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard 
                        title={translations.stats.totalBeers} 
                        value={stats.totalBeers} 
                        icon={<BeerIcon />} 
                        color="primary" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard 
                        title={translations.stats.averagePerHour} 
                        value={stats.averageBeersPerHour.toFixed(1)} 
                        icon={<SpeedIcon />} 
                        color="error" 
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard
                        title="Průměr na osobu"
                        value={stats.participantsCount > 0 ? (stats.totalBeers / stats.participantsCount).toFixed(1) : '0'}
                        icon={<GroupIcon />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <MetricCard 
                        title={translations.stats.totalParticipants} 
                        value={stats.participantsCount} 
                        icon={<GroupIcon />} 
                        color="warning" 
                    />
                </Grid>
            </Grid>

            {/* Charts and Analytics Section */}
            <Grid container spacing={3} mb={4}>
                {/* Hourly Beer Consumption Chart */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ borderRadius: tokens.borderRadius.md, height: 'fit-content' }}>
                        <Box p={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <AccessTimeIcon sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Spotřeba piv během dne
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={useCustomDate}
                                                onChange={(e) => setUseCustomDate(e.target.checked)}
                                                size="small"
                                            />
                                        }
                                        label="Vlastní datum"
                                        sx={{ fontSize: '0.875rem' }}
                                    />
                                    {useCustomDate && (
                                        <DatePicker
                                            value={selectedDate}
                                            onChange={(newDate) => setSelectedDate(newDate)}
                                            format="dd.MM.yyyy"
                                            slotProps={{
                                                textField: {
                                                    size: 'small',
                                                    sx: { width: 130 }
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {hourlyStats.map((data, index) => (
                                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
                                        <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 'bold' }}>
                                            {data.hour.toString().padStart(2, '0')}:00
                                        </Typography>
                                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Box
                                                sx={{
                                                    height: 16,
                                                    width: `${hourlyStats.length > 0 && Math.max(...hourlyStats.map(d => d.count)) > 0 ? (data.count / Math.max(...hourlyStats.map(d => d.count))) * 100 : 0}%`,
                                                    bgcolor: data.hour === peakHour.hour ? 'error.main' : 'primary.main',
                                                    borderRadius: tokens.borderRadius.xs,
                                                    transition: tokens.transitions.slow,
                                                    minWidth: data.count > 0 ? 4 : 0,
                                                }}
                                            />
                                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                                                {data.count} piv
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </Card>
                </Grid>

                {/* Right Sidebar - Active Barrel Chart and Fun Statistics */}
                <Grid item xs={12} lg={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Active Barrel Chart */}
                        <Card sx={{ borderRadius: tokens.borderRadius.md }}>
                            <Box p={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <BarrelIcon sx={{ color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Aktivní sud
                                    </Typography>
                                </Box>
                                <ActiveBarrelGraph barrel={activeBarrel} />
                            </Box>
                        </Card>

                        {/* Fun Statistics */}
                        <Card sx={{ borderRadius: tokens.borderRadius.md }}>
                            <Box p={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <FaFire style={{ color: '#ff6b35', fontSize: '1.5rem' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Zajímavé statistiky
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.50', borderRadius: tokens.borderRadius.xs }}>
                                        <FaTrophy style={{ color: '#ffd700' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Nejrychlejší pivař</Typography>
                                            <Typography variant="body1" fontWeight="bold">{funStats.fastestDrinker}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'error.50', borderRadius: tokens.borderRadius.xs }}>
                                        <FaClock style={{ color: '#ff6b35' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Nejaktivnější hodina</Typography>
                                            <Typography variant="body1" fontWeight="bold">{funStats.mostActiveHour} ({funStats.beersInPeakHour} piv)</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'warning.50', borderRadius: tokens.borderRadius.xs }}>
                                        <TrendingDownIcon sx={{ color: 'warning.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Efektivita spotřeby</Typography>
                                            <Typography variant="body1" fontWeight="bold">{stats.consumptionEfficiency.toFixed(1)}%</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>

                        {/* Barrel Statistics */}
                        <Card sx={{ borderRadius: tokens.borderRadius.md }}>
                            <Box p={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <BarrelIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                                        Statistiky sudů
                                    </Typography>
                                </Box>
                                {dashboardStats.barrelStats.length > 0 ? (
                                    <Grid container spacing={0.5}>
                                        {dashboardStats.barrelStats.map((stat, index) => (
                                            <Grid item xs={4} key={index}>
                                                <Box sx={{ 
                                                    p: 1, 
                                                    textAlign: 'center', 
                                                    border: 1, 
                                                    borderColor: 'divider', 
                                                    borderRadius: tokens.borderRadius.xs,
                                                    bgcolor: 'background.paper'
                                                }}>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                        {stat.size}L
                                                    </Typography>
                                                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem' }}>
                                                        {stat.count}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Box sx={{ p: 1.5, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: tokens.borderRadius.xs }}>
                                        <Typography variant="caption" color="text.secondary">Žádné sudy</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Card>
                    </Box>
                </Grid>
            </Grid>

            {/* Top Users Section - Full Width */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12}>
                    <Card sx={{ borderRadius: tokens.borderRadius.md }}>
                        <Box p={3}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                <TrophyIcon sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Nejlepší uživatelé
                                </Typography>
                            </Box>
                            <Grid container spacing={2}>
                                {dashboardStats.topUsers.map((user, index) => (
                                    <Grid item xs={12} sm={6} md={3} key={user.id}>
                                        <Box sx={{ 
                                            p: 2, 
                                            border: 1, 
                                            borderColor: 'divider', 
                                            borderRadius: tokens.borderRadius.md, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 2,
                                            background: index === 0 ? 'primary.50' : 'background.paper'
                                        }}>
                                            <Avatar 
                                                sx={{ 
                                                    width: 40, 
                                                    height: 40, 
                                                    bgcolor: index === 0 ? 'primary.main' : 'grey.500',
                                                    fontSize: '0.9rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {user.username.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="body1" fontWeight="bold">{user.username}</Typography>
                                                <Typography variant="body2" color="text.secondary">{user.beerCount} piv</Typography>
                                            </Box>
                                            {index === 0 && (
                                                <Chip 
                                                    label="Největší pivař" 
                                                    size="small" 
                                                    color="warning" 
                                                    sx={{ fontSize: '0.7rem' }}
                                                />
                                            )}
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}; 