import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Grid, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert, Box, Chip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import type { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { format } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';

export const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        startDate: new Date(),
    });
    const navigate = useNavigate();
    const { loadActiveEvent } = useActiveEvent();

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const data = await eventService.getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events:', error);
        }
    };

    const handleCreateEvent = async () => {
        try {
            await eventService.createEvent({
                name: newEvent.name,
                description: newEvent.description,
                startDate: newEvent.startDate.toISOString(),
            });
            setOpen(false);
            await Promise.all([loadEvents(), loadActiveEvent()]);
            setNewEvent({ name: '', description: '', startDate: new Date() });
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    const handleEndEvent = async (eventId: string) => {
        try {
            await eventService.endEvent(eventId);
            await Promise.all([loadEvents(), loadActiveEvent()]);
        } catch (error) {
            console.error('Failed to end event:', error);
        }
    };

    return (
        <div>
            {/* Header */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                <Typography variant="h4">Events</Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={() => setOpen(true)}
                    sx={{ px: 4 }}
                >
                    Create New Event
                </Button>
            </Box>

            {/* Info Alert */}
            <Alert severity="info" sx={{ mb: 4 }}>
                <Typography>
                    V aplikaci může být vždy pouze jedna aktivní událost. Při vytvoření nové události se automaticky ukončí předchozí aktivní událost.
                    Aktivní událost se zobrazuje v záhlaví a všichni nově přidaní účastníci a sudy jsou automaticky přiřazeni k této události.
                </Typography>
            </Alert>

            {/* Events Grid */}
            <Grid container spacing={3}>
                {events.map((event) => (
                    <Grid item xs={12} md={6} lg={4} key={event.id}>
                        <Card sx={{ 
                            p: 3, 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            position: 'relative',
                            borderRadius: 2,
                            '&:hover': {
                                boxShadow: (theme) => theme.shadows[4]
                            }
                        }}>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{event.name}</Typography>
                                    {event.isActive && (
                                        <Chip
                                            label="Aktivní událost"
                                            color="primary"
                                            size="small"
                                            sx={{ ml: 2 }}
                                        />
                                    )}
                                </Box>
                                {event.description && (
                                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                                        {event.description}
                                    </Typography>
                                )}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Start: {format(new Date(event.startDate), 'PPpp')}
                                    </Typography>
                                    {event.endDate && (
                                        <Typography variant="body2" color="text.secondary">
                                            End: {format(new Date(event.endDate), 'PPpp')}
                                        </Typography>
                                    )}
                                    <Typography variant="body2" color="text.secondary">
                                        Status: {event.isActive ? 'Aktivní' : 'Ukončená'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Účastníci: {event.users?.length || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Sudy: {event.barrels?.length || 0}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate(`/events/${event.id}`)}
                                >
                                    Zobrazit detail
                                </Button>
                                {event.isActive && (
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        fullWidth
                                        onClick={() => handleEndEvent(event.id)}
                                    >
                                        Ukončit událost
                                    </Button>
                                )}
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Create Event Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Vytvořit novou událost</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 3, mt: 2 }}>
                        Vytvořením nové události se automaticky ukončí aktuálně aktivní událost.
                    </Alert>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Název události"
                        fullWidth
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Popis"
                        fullWidth
                        multiline
                        rows={4}
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    <DateTimePicker
                        label="Datum začátku"
                        value={newEvent.startDate}
                        onChange={(date: Date | null) => date && setNewEvent({ ...newEvent, startDate: date })}
                        sx={{ mt: 3, width: '100%' }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setOpen(false)}>Zrušit</Button>
                    <Button onClick={handleCreateEvent} variant="contained" color="primary">
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}; 