import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
    LocalBar as BeerIcon,
    Group as GroupIcon,
    Storage as BarrelIcon,
    Speed as SpeedIcon,
    EmojiEvents as TrophyIcon,
    TrendingDown as TrendingDownIcon,
    AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { FaTrophy, FaFire, FaClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { cs } from 'date-fns/locale';
import { eventService } from '../../services/eventService';
import { barrelService } from '../../services/barrelService';
import { dashboardService } from '../../services/dashboardService';
import { ActiveBarrelGraph } from './Barrels/ActiveBarrelGraph';
import type { Event } from '../../types/event';
import type { DashboardStats } from '../../types/dashboard';
import type { HourlyStats } from '../../types/hourlyStats';
import type { Barrel } from '../../types/barrel';
import translations from '../../locales/cs/dashboard.json';
import { useSelectedEvent } from '../../contexts/SelectedEventContext';
import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../types/featureFlags';
import { EventSelector } from '../../components/EventSelector';
import { EmptyEventState } from '../../components/EmptyEventState';
import { PageLoader } from '../../components/ui/PageLoader';
import { usePageTitle } from '../../hooks/usePageTitle';

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
    });
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [useCustomDate, setUseCustomDate] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedEvent?.id, selectedDate, useCustomDate]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            
            // Prepare date parameter for hourly stats
            const dateParam = useCustomDate && selectedDate ? selectedDate.toISOString().split('T')[0] : undefined;
            
            const [eventData, barrelsData, dashboardData, hourlyData] = await Promise.all([
                eventService.getActiveEvent(),
                barrelService.getAll(),
                dashboardService.getDashboardStats(selectedEvent?.id),
                selectedEvent?.id ? dashboardService.getHourlyStats(selectedEvent.id, dateParam) : Promise.resolve([]),
            ]);

            setActiveEvent(eventData);
            setDashboardStats(dashboardData);
            setBarrels(barrelsData);
            setHourlyStats(hourlyData);

            if (eventData) {
                const activeBarrels = barrelsData.filter(b => b.isActive).length;
                const remainingBeers = barrelsData.reduce((sum, barrel) => {
                    if (barrel.isActive) return sum + barrel.remainingBeers;
                    return sum;
                }, 0);

                const eventStart = new Date(eventData.startDate);
                
                setStats({
                    totalBeers: dashboardData.totalBeers,
                    activeBarrels,
                    remainingBeers,
                    topDrinker: dashboardData.topUsers[0] ? 
                        { username: dashboardData.topUsers[0].username, count: dashboardData.topUsers[0].beerCount } : 
                        { username: null, count: 0 },
                    averageBeersPerHour: dashboardData.totalUsers > 0 ? (dashboardData.totalBeers / dashboardData.totalUsers) : 0,
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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h4">{translations.title}</Typography>
                    {showEventHistory && <EventSelector />}
                </Box>
            </Box>

            {/* Main Statistics Cards */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <BeerIcon sx={{ color: 'white' }} />
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
                                bgcolor: 'error.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <SpeedIcon sx={{ color: 'white' }} />
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
                                bgcolor: 'success.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <BarrelIcon sx={{ color: 'white' }} />
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
                                bgcolor: 'warning.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <GroupIcon sx={{ color: 'white' }} />
                            </Box>
                            <Typography color="text.secondary">{translations.stats.totalParticipants}</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {stats.participantsCount}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts and Analytics Section */}
            <Grid container spacing={3} mb={4}>
                {/* Hourly Beer Consumption Chart */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ borderRadius: 2, height: 'fit-content' }}>
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
                                                    borderRadius: 1,
                                                    transition: 'width 0.3s ease',
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
                        <Card sx={{ borderRadius: 2 }}>
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
                        <Card sx={{ borderRadius: 2 }}>
                            <Box p={3}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                    <FaFire style={{ color: '#ff6b35', fontSize: '1.5rem' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Zajímavé statistiky
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                                        <FaTrophy style={{ color: '#ffd700' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Nejrychlejší pivař</Typography>
                                            <Typography variant="body1" fontWeight="bold">{funStats.fastestDrinker}</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                                        <FaClock style={{ color: '#ff6b35' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Nejaktivnější hodina</Typography>
                                            <Typography variant="body1" fontWeight="bold">{funStats.mostActiveHour} ({funStats.beersInPeakHour} piv)</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'warning.50', borderRadius: 1 }}>
                                        <TrendingDownIcon sx={{ color: 'warning.main' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Efektivita spotřeby</Typography>
                                            <Typography variant="body1" fontWeight="bold">{funStats.efficiency}%</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Card>

                        {/* Barrel Statistics */}
                        <Card sx={{ borderRadius: 2 }}>
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
                                                    borderRadius: 1,
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
                                    <Box sx={{ p: 1.5, textAlign: 'center', border: '2px dashed', borderColor: 'divider', borderRadius: 1 }}>
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
                    <Card sx={{ borderRadius: 2 }}>
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
                                            borderRadius: 2, 
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