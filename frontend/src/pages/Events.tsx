import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Container, Grid, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import type { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { format } from 'date-fns';

export const Events: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        startDate: new Date(),
    });
    const navigate = useNavigate();

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
            loadEvents();
            setNewEvent({ name: '', description: '', startDate: new Date() });
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    const handleEndEvent = async (eventId: string) => {
        try {
            await eventService.endEvent(eventId);
            loadEvents();
        } catch (error) {
            console.error('Failed to end event:', error);
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

            <Grid container spacing={3}>
                {events.map((event) => (
                    <Grid item xs={12} md={6} lg={4} key={event.id}>
                        <Card sx={{ p: 2 }}>
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
                                Status: {event.isActive ? 'Active' : 'Ended'}
                            </Typography>
                            <Typography variant="body2">
                                Participants: {event.participants.length}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Barrels: {event.barrels.length}
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate(`/events/${event.id}`)}
                                    >
                                        View Details
                                    </Button>
                                </Grid>
                                {event.isActive && (
                                    <Grid item>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={() => handleEndEvent(event.id)}
                                        >
                                            End Event
                                        </Button>
                                    </Grid>
                                )}
                            </Grid>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Event Name"
                        fullWidth
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Description"
                        fullWidth
                        multiline
                        rows={4}
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    />
                    <DateTimePicker
                        label="Start Date"
                        value={newEvent.startDate}
                        onChange={(date: Date | null) => date && setNewEvent({ ...newEvent, startDate: date })}
                        sx={{ mt: 2, width: '100%' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateEvent} variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 