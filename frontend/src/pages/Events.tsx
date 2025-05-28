import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Grid, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert, Box, Chip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import type { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { format } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../types/featureFlags';

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
    const showActiveEventFunctionality = useFeatureFlag(FeatureFlagKey.ACTIVE_EVENT_FUNCTIONALITY);

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

    const handleMakeActive = async (eventId: string) => {
        try {
            await eventService.makeEventActive(eventId);
            await Promise.all([loadEvents(), loadActiveEvent()]);
        } catch (error) {
            console.error('Failed to make event active:', error);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Grid item>
                    <Typography variant="h4">Events</Typography>
                </Grid>
                <Grid item>
                    <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
                        Create New Event
                    </Button>
                </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body1">
                    V aplikaci může být vždy pouze jedna aktivní událost. Při vytvoření nové události se automaticky ukončí předchozí aktivní událost.
                    Aktivní událost se zobrazuje v záhlaví a všichni nově přidaní účastníci a sudy jsou automaticky přiřazeni k této události.
                </Typography>
            </Alert>

            <Grid container spacing={3}>
                {events.map((event) => (
                    <Grid item xs={12} md={6} lg={4} key={event.id}>
                        <Card sx={{ p: 2, position: 'relative' }}>
                            {event.isActive && (
                                <Chip
                                    label="Aktivní událost"
                                    color="primary"
                                    sx={{
                                        position: 'absolute',
                                        top: 16,
                                        right: 16,
                                    }}
                                />
                            )}
                            <Box sx={{ mt: event.isActive ? 4 : 0 }}>
                                <Typography variant="h6">{event.name}</Typography>
                                <Typography color="textSecondary" gutterBottom>
                                    {event.description}
                                </Typography>
                                <Typography variant="body2">
                                    Start: {format(new Date(event.startDate), 'PPpp')}
                                </Typography>
                                {event.endDate && (
                                    <Typography variant="body2">
                                        End: {format(new Date(event.endDate), 'PPpp')}
                                    </Typography>
                                )}
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Status: {event.isActive ? 'Aktivní' : 'Ukončená'}
                                </Typography>
                                <Typography variant="body2">
                                    Účastníci: {event.users?.length || 0}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 2 }}>
                                    Sudy: {event.barrels?.length || 0}
                                </Typography>
                                <Grid container spacing={1}>
                                    <Grid item>
                                        <Button
                                            variant="outlined"
                                            onClick={() => navigate(`/events/${event.id}`)}
                                        >
                                            Zobrazit detail
                                        </Button>
                                    </Grid>
                                    {event.isActive ? (
                                        <Grid item>
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleEndEvent(event.id)}
                                            >
                                                Ukončit událost
                                            </Button>
                                        </Grid>
                                    ) : (
                                        showActiveEventFunctionality && (
                                            <Grid item>
                                                <Button
                                                    variant="outlined"
                                                    color="success"
                                                    onClick={() => handleMakeActive(event.id)}
                                                >
                                                    Aktivovat událost
                                                </Button>
                                            </Grid>
                                        )
                                    )}
                                </Grid>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Vytvořit novou událost</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2, mt: 2 }}>
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
                    />
                    <DateTimePicker
                        label="Datum začátku"
                        value={newEvent.startDate}
                        onChange={(date: Date | null) => date && setNewEvent({ ...newEvent, startDate: date })}
                        sx={{ mt: 2, width: '100%' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Zrušit</Button>
                    <Button onClick={handleCreateEvent} variant="contained" color="primary">
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 