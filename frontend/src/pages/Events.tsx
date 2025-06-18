import React, { useState, useEffect } from 'react';
import { 
    Button, 
    Grid, 
    Typography, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    TextField, 
    DialogActions, 
    Box, 
    Chip, 
    IconButton,
    Paper,
    CircularProgress,
    Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import type { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { format, isValid, parseISO } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { EmptyEventState } from '../components/EmptyEventState';
import { 
    Add as AddIcon, 
    Person as PersonIcon, 
    FilterAlt as FilterIcon, 
    Circle as CircleIcon, 
    MoreVert as MoreVertIcon,
    LocalBar as BeerIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Helper function to safely format dates
const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '-';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd.MM.yyyy HH:mm') : '-';
};

export const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: null as Date | null,
    });
    const { loadActiveEvent } = useActiveEvent();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await eventService.getAllEvents();
            if (Array.isArray(data)) {
                setEvents(data);
            } else {
                console.error('Events data is not an array:', data);
                setEvents([]);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
            setError('Nepodařilo se načíst události.');
            setEvents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateEvent = async () => {
        try {
            setError(null);
            await eventService.createEvent({
                name: newEvent.name,
                description: newEvent.description,
                startDate: newEvent.startDate.toISOString(),
                ...(newEvent.endDate && { endDate: newEvent.endDate.toISOString() }),
            });
            setOpen(false);
            await Promise.all([loadEvents(), loadActiveEvent()]);
            setNewEvent({ name: '', description: '', startDate: new Date(), endDate: null });
        } catch (error) {
            console.error('Failed to create event:', error);
            setError('Nepodařilo se vytvořit událost.');
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 4 }}>
                <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh'
                }}>
                    <CircularProgress />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ 
                mb: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>Události</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Spravujte své pivní události s elegancí
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={() => setOpen(true)}
                        startIcon={<AddIcon />}
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            boxShadow: 1,
                        }}
                    >
                        Vytvořit událost
                    </Button>
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<FilterIcon />}
                        sx={{
                            px: 3,
                            py: 1,
                            borderRadius: 2,
                            borderColor: 'divider',
                        }}
                    >
                        Žebříček
                    </Button>
                </Box>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error}
                </Alert>
            )}

            {/* Info Alert */}
            <Paper
                elevation={0}
                sx={{ 
                    mb: 4,
                    p: 3,
                    backgroundColor: '#FEE2E2',
                    borderRadius: 2,
                    border: '1px solid #FCA5A5',
                }}
            >
                <Box display="flex" alignItems="flex-start" gap={2}>
                    <CircleIcon sx={{ color: '#DC2626', fontSize: 20, mt: 0.5 }} />
                    <Typography sx={{ 
                        color: '#991B1B', 
                        lineHeight: 1.5,
                    }}>
                        V aplikaci může být vždy pouze jedna aktivní událost. Při vytvoření nové události se automaticky ukončí předchozí aktivní událost. Aktivní událost se zobrazuje v záhlaví a všichni nově přidaní účastníci a sudy jsou automaticky přiřazeni k této události.
                    </Typography>
                </Box>
            </Paper>

            {/* Events Grid or Empty State */}
            {Array.isArray(events) && events.length > 0 ? (
                <Grid container spacing={3}>
                    {events.map((event) => {
                        return (
                            <Grid item xs={12} md={6} lg={4} key={event.id}>
                                <Paper 
                                    elevation={2}
                                    onClick={() => navigate(`/events/${event.id}`)}
                                    sx={{ 
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                        },
                                        bgcolor: 'white',
                                    }}
                                >
                                    {/* Card Header */}
                                    <Box sx={{ p: 3, bgcolor: 'error.main', color: 'white' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                {event.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {event.isActive && (
                                                    <Chip
                                                        label="Aktivní"
                                                        size="small"
                                                        sx={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                            color: 'white',
                                                            fontWeight: 500,
                                                            height: 24,
                                                        }}
                                                    />
                                                )}
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Handle menu open
                                                    }}
                                                    sx={{ 
                                                        color: 'white', 
                                                        opacity: 0.8, 
                                                        '&:hover': { 
                                                            opacity: 1,
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                        },
                                                        zIndex: 2,
                                                    }}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        
                                        {/* Dates */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box 
                                                    component="span" 
                                                    sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#22C55E',
                                                    }} 
                                                />
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                    {formatDate(event.startDate)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box 
                                                    component="span" 
                                                    sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#EF4444',
                                                    }} 
                                                />
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                    {formatDate(event.endDate)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Stats */}
                                    <Box sx={{ 
                                        p: 3,
                                        display: 'flex',
                                        gap: 3,
                                    }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Účastníci
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {event.users?.length || 0}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <BeerIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Piva
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {event.eventBeers?.length || 0}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <FilterIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Sudy
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {event.barrels?.length || 0}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <EmptyEventState />
            )}

            {/* Create Event Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Vytvořit novou událost</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Název události"
                            fullWidth
                            value={newEvent.name}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <TextField
                            label="Popis"
                            fullWidth
                            multiline
                            rows={3}
                            value={newEvent.description}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <DateTimePicker
                            label="Začátek"
                            value={newEvent.startDate}
                            onChange={(date) => date && setNewEvent(prev => ({ ...prev, startDate: date }))}
                        />
                        <DateTimePicker
                            label="Konec (volitelné)"
                            value={newEvent.endDate}
                            onChange={(date) => setNewEvent(prev => ({ ...prev, endDate: date }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Zrušit</Button>
                    <Button 
                        variant="contained" 
                        color="error" 
                        onClick={handleCreateEvent}
                        disabled={!newEvent.name || !newEvent.startDate}
                    >
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 