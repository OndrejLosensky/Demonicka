import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Grid,
    Typography,
    Card,
    Button,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Box,
    Chip,
} from '@mui/material';
import type { Event } from '../types/event';
import type { Participant } from '../types/participant';
import type { Barrel } from '../types/barrel';
import { eventService } from '../services/eventService';
import { participantsService } from '../services/participantsService';
import { barrelService } from '../services/barrelService';
import { format } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../types/featureFlags';

export const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
    const [openParticipant, setOpenParticipant] = useState(false);
    const [openBarrel, setOpenBarrel] = useState(false);
    const [selectedParticipant, setSelectedParticipant] = useState('');
    const [selectedBarrel, setSelectedBarrel] = useState('');
    const { loadActiveEvent } = useActiveEvent();
    const showActiveEventFunctionality = useFeatureFlag(FeatureFlagKey.ACTIVE_EVENT_FUNCTIONALITY);

    useEffect(() => {
        if (id) {
            loadEventData();
            loadParticipants();
            loadBarrels();
        }
    }, [id]);

    const loadEventData = async () => {
        try {
            if (id) {
                const data = await eventService.getEvent(id);
                setEvent(data);
            }
        } catch (error) {
            console.error('Failed to load event:', error);
        }
    };

    const loadParticipants = async () => {
        try {
            const data = await participantsService.getAllParticipants();
            setParticipants(data);
        } catch (error) {
            console.error('Failed to load participants:', error);
        }
    };

    const loadBarrels = async () => {
        try {
            const data = await barrelService.getAllBarrels();
            setBarrels(data);
        } catch (error) {
            console.error('Failed to load barrels:', error);
        }
    };

    const handleAddParticipant = async () => {
        try {
            if (id && selectedParticipant) {
                await eventService.addParticipant(id, selectedParticipant);
                await Promise.all([loadEventData(), loadParticipants()]);
                if (event?.isActive) {
                    await loadActiveEvent();
                }
                setOpenParticipant(false);
                setSelectedParticipant('');
            }
        } catch (error) {
            console.error('Failed to add participant:', error);
        }
    };

    const handleAddBarrel = async () => {
        try {
            if (id && selectedBarrel) {
                await eventService.addBarrel(id, selectedBarrel);
                await Promise.all([loadEventData(), loadBarrels()]);
                if (event?.isActive) {
                    await loadActiveEvent();
                }
                setOpenBarrel(false);
                setSelectedBarrel('');
            }
        } catch (error) {
            console.error('Failed to add barrel:', error);
        }
    };

    const handleEndEvent = async () => {
        try {
            if (id) {
                await eventService.endEvent(id);
                await Promise.all([loadEventData(), loadActiveEvent()]);
            }
        } catch (error) {
            console.error('Failed to end event:', error);
        }
    };

    const handleMakeActive = async () => {
        try {
            if (id) {
                await eventService.makeEventActive(id);
                await Promise.all([loadEventData(), loadActiveEvent()]);
            }
        } catch (error) {
            console.error('Failed to make event active:', error);
        }
    };

    if (!event) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card sx={{ p: 3, position: 'relative' }}>
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
                            <Typography variant="h4" gutterBottom>
                                {event.name}
                            </Typography>
                            <Typography color="textSecondary" paragraph>
                                {event.description}
                            </Typography>
                            <Typography variant="body1">
                                Začátek: {format(new Date(event.startDate), 'PPpp')}
                            </Typography>
                            {event.endDate && (
                                <Typography variant="body1">
                                    Konec: {format(new Date(event.endDate), 'PPpp')}
                                </Typography>
                            )}
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Status: {event.isActive ? 'Aktivní' : 'Ukončená'}
                            </Typography>

                            {event.isActive && (
                                <>
                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        Toto je aktivní událost. Všichni nově přidaní účastníci a sudy budou automaticky přiřazeni k této události.
                                    </Alert>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={handleEndEvent}
                                        sx={{ mb: 3 }}
                                    >
                                        Ukončit událost
                                    </Button>
                                </>
                            )}

                            {!event.isActive && showActiveEventFunctionality && (
                                <Button
                                    variant="contained"
                                    color="success"
                                    onClick={handleMakeActive}
                                    sx={{ mb: 3 }}
                                >
                                    Aktivovat událost
                                </Button>
                            )}

                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Účastníci ({event.participants.length})
                                        </Typography>
                                        {event.isActive && (
                                            <Button
                                                variant="outlined"
                                                onClick={() => setOpenParticipant(true)}
                                                sx={{ mb: 2 }}
                                            >
                                                Přidat účastníka
                                            </Button>
                                        )}
                                        <List>
                                            {event.participants.map((participant) => (
                                                <ListItem key={participant.id}>
                                                    <ListItemText
                                                        primary={participant.name}
                                                        secondary={`Počet piv: ${participant.beerCount}`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ p: 2 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Sudy ({event.barrels.length})
                                        </Typography>
                                        {event.isActive && (
                                            <Button
                                                variant="outlined"
                                                onClick={() => setOpenBarrel(true)}
                                                sx={{ mb: 2 }}
                                            >
                                                Přidat sud
                                            </Button>
                                        )}
                                        <List>
                                            {event.barrels.map((barrel) => (
                                                <ListItem key={barrel.id}>
                                                    <ListItemText
                                                        primary={`Sud ${barrel.size}L (#${barrel.orderNumber})`}
                                                        secondary={`Zbývá piv: ${barrel.remainingBeers}`}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={openParticipant} onClose={() => setOpenParticipant(false)}>
                <DialogTitle>Přidat účastníka</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Vybrat účastníka</InputLabel>
                        <Select
                            value={selectedParticipant}
                            onChange={(e) => setSelectedParticipant(e.target.value)}
                            label="Vybrat účastníka"
                        >
                            {participants.map((participant) => (
                                <MenuItem key={participant.id} value={participant.id}>
                                    {participant.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenParticipant(false)}>Zrušit</Button>
                    <Button onClick={handleAddParticipant} variant="contained" color="primary">
                        Přidat
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openBarrel} onClose={() => setOpenBarrel(false)}>
                <DialogTitle>Přidat sud</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Vybrat sud</InputLabel>
                        <Select
                            value={selectedBarrel}
                            onChange={(e) => setSelectedBarrel(e.target.value)}
                            label="Vybrat sud"
                        >
                            {barrels.map((barrel) => (
                                <MenuItem key={barrel.id} value={barrel.id}>
                                    Sud {barrel.size}L (#{barrel.orderNumber})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBarrel(false)}>Zrušit</Button>
                    <Button onClick={handleAddBarrel} variant="contained" color="primary">
                        Přidat
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 