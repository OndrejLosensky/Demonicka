import React, { useState, useEffect } from 'react';
import { Button, Card, Grid, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Box, Chip, IconButton } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import type { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { format } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { EmptyEventState } from '../components/EmptyEventState';
import { Add as AddIcon, Person as PersonIcon, FilterAlt as FilterIcon, Circle as CircleIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, Record<string, number>>>({});
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: null as Date | null,
    });
    const { loadActiveEvent } = useActiveEvent();
    const navigate = useNavigate();

    useEffect(() => {
        loadEvents();
    }, []);

    useEffect(() => {
        loadEventBeerCounts();
    }, [events]);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    };

    const loadEventBeerCounts = async () => {
        try {
            const counts: Record<string, Record<string, number>> = {};
            await Promise.all(
                events.map(async (event) => {
                    counts[event.id] = {};
                    await Promise.all(
                        event.users.map(async (user) => {
                            const count = await eventService.getUserEventBeerCount(event.id, user.id);
                            counts[event.id][user.id] = count;
                        })
                    );
                })
            );
            setEventBeerCounts(counts);
        } catch (error) {
            console.error('Failed to load event beer counts:', error);
        }
    };

    const handleCreateEvent = async () => {
        try {
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
        }
    };

    return (
        <div>
            {/* Header */}
            <Box sx={{ 
                mb: 5,
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
                        sx={{ 
                            backgroundColor: '#DC2626',
                            '&:hover': {
                                backgroundColor: '#B91C1C',
                            },
                            borderRadius: 2,
                            boxShadow: 'none',
                            height: 40,
                        }}
                        onClick={() => setOpen(true)}
                        startIcon={<AddIcon />}
                    >
                        Vytvořit událost
                    </Button>
                    <Button
                        variant="outlined"
                        sx={{
                            borderColor: 'rgba(0, 0, 0, 0.12)',
                            color: 'text.primary',
                            '&:hover': {
                                borderColor: 'rgba(0, 0, 0, 0.24)',
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            },
                            borderRadius: 2,
                            height: 40,
                        }}
                        startIcon={<FilterIcon />}
                    >
                        Žebříček
                    </Button>
                </Box>
            </Box>

            {/* Info Alert */}
            <Box 
                sx={{ 
                    mb: 4,
                    p: 3,
                    backgroundColor: '#FEE2E2',
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2,
                    border: '1px solid #FCA5A5',
                }}
            >
                <CircleIcon sx={{ color: '#DC2626', fontSize: 20, mt: 0.5 }} />
                <Typography sx={{ 
                    fontSize: '0.95rem', 
                    color: '#991B1B', 
                    lineHeight: 1.5,
                    flex: 1,
                }}>
                    V aplikaci může být vždy pouze jedna aktivní událost. Při vytvoření nové události se automaticky ukončí předchozí aktivní událost. Aktivní událost se zobrazuje v záhlaví a všichni nově přidaní účastníci a sudy jsou automaticky přiřazeni k této události.
                </Typography>
            </Box>

            {/* Events Grid or Empty State */}
            {events.length > 0 ? (
                <Grid container spacing={3}>
                    {events.map((event) => {
                        const totalEventBeers = Object.values(eventBeerCounts[event.id] || {}).reduce((sum, count) => sum + count, 0);
                        
                        return (
                            <Grid item xs={12} md={6} lg={4} key={event.id}>
                                <Card 
                                    sx={{ 
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                                        },
                                        position: 'relative',
                                        background: '#DC2626',
                                    }}
                                >
                                    {/* Card Header */}
                                    <Box sx={{ p: 3, position: 'relative' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>
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
                                                    sx={{ 
                                                        color: 'white', 
                                                        opacity: 0.8, 
                                                        '&:hover': { 
                                                            opacity: 1,
                                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                                        } 
                                                    }}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                        
                                        {/* Dates */}
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <Box 
                                                    component="span" 
                                                    sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#22C55E',
                                                        mr: 1,
                                                    }} 
                                                />
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                    {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box 
                                                    component="span" 
                                                    sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#EF4444',
                                                        mr: 1,
                                                    }} 
                                                />
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                    {event.endDate ? format(new Date(event.endDate), 'dd.MM.yyyy HH:mm') : '-'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Stats */}
                                    <Box sx={{ 
                                        bgcolor: 'white', 
                                        p: 3,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                    }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Účastníci
                                                </Typography>
                                            </Box>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {event.users?.length || 0}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <FilterIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Sudy
                                                </Typography>
                                            </Box>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                {event.barrels?.length || 0}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <CircleIcon sx={{ fontSize: 20, color: '#DC2626' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Piva
                                                </Typography>
                                            </Box>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#DC2626' }}>
                                                {totalEventBeers}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Action Button */}
                                    <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                                        <Button
                                            fullWidth
                                            onClick={() => navigate(`/events/${event.id}`)}
                                            sx={{
                                                color: '#DC2626',
                                                '&:hover': {
                                                    backgroundColor: 'rgba(220, 38, 38, 0.04)',
                                                },
                                                textTransform: 'none',
                                                fontWeight: 500,
                                            }}
                                        >
                                            Zobrazit detail
                                        </Button>
                                    </Box>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <Box sx={{ mt: 4 }}>
                    <EmptyEventState 
                        title="Zatím zde nejsou žádné události"
                        subtitle="Vytvořte svou první událost pro sledování piv a účastníků"
                    />
                </Box>
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
                            onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                        />
                        <TextField
                            label="Popis"
                            fullWidth
                            multiline
                            rows={3}
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        />
                        <DateTimePicker
                            label="Začátek události"
                            value={newEvent.startDate}
                            onChange={(date) => date && setNewEvent({ ...newEvent, startDate: date })}
                        />
                        <DateTimePicker
                            label="Konec události (volitelné)"
                            value={newEvent.endDate}
                            onChange={(date) => setNewEvent({ ...newEvent, endDate: date })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Zrušit</Button>
                    <Button onClick={handleCreateEvent} variant="contained" color="primary">
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}; 