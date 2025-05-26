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
} from '@mui/material';
import type { Event } from '../types/event';
import type { User } from '../types/user';
import type { Barrel } from '../types/barrel';
import { eventService } from '../services/eventService';
import { userService } from '../services/userService';
import { barrelService } from '../services/barrelService';
import { format } from 'date-fns';

export const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
    const [openParticipant, setOpenParticipant] = useState(false);
    const [openBarrel, setOpenBarrel] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedBarrel, setSelectedBarrel] = useState('');

    useEffect(() => {
        if (id) {
            loadEventData();
            loadUsers();
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

    const loadUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
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
            if (id && selectedUser) {
                await eventService.addParticipant(id, selectedUser);
                loadEventData();
                setOpenParticipant(false);
                setSelectedUser('');
            }
        } catch (error) {
            console.error('Failed to add participant:', error);
        }
    };

    const handleAddBarrel = async () => {
        try {
            if (id && selectedBarrel) {
                await eventService.addBarrel(id, selectedBarrel);
                loadEventData();
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
                loadEventData();
            }
        } catch (error) {
            console.error('Failed to end event:', error);
        }
    };

    if (!event) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Card sx={{ p: 3 }}>
                        <Typography variant="h4" gutterBottom>
                            {event.name}
                        </Typography>
                        <Typography color="textSecondary" paragraph>
                            {event.description}
                        </Typography>
                        <Typography variant="body1">
                            Start: {format(new Date(event.startDate), 'PPpp')}
                        </Typography>
                        {event.endDate && (
                            <Typography variant="body1">
                                End: {format(new Date(event.endDate), 'PPpp')}
                            </Typography>
                        )}
                        <Typography variant="body1" sx={{ mb: 2 }}>
                            Status: {event.isActive ? 'Active' : 'Ended'}
                        </Typography>

                        {event.isActive && (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleEndEvent}
                                sx={{ mb: 3 }}
                            >
                                End Event
                            </Button>
                        )}

                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Participants ({event.participants.length})
                                    </Typography>
                                    {event.isActive && (
                                        <Button
                                            variant="outlined"
                                            onClick={() => setOpenParticipant(true)}
                                            sx={{ mb: 2 }}
                                        >
                                            Add Participant
                                        </Button>
                                    )}
                                    <List>
                                        {event.participants.map((participant) => (
                                            <ListItem key={participant.id}>
                                                <ListItemText
                                                    primary={participant.username}
                                                    secondary={participant.email}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card variant="outlined" sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Barrels ({event.barrels.length})
                                    </Typography>
                                    {event.isActive && (
                                        <Button
                                            variant="outlined"
                                            onClick={() => setOpenBarrel(true)}
                                            sx={{ mb: 2 }}
                                        >
                                            Add Barrel
                                        </Button>
                                    )}
                                    <List>
                                        {event.barrels.map((barrel) => (
                                            <ListItem key={barrel.id}>
                                                <ListItemText
                                                    primary={barrel.name}
                                                    secondary={`Volume: ${barrel.volume}L`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Card>
                            </Grid>
                        </Grid>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={openParticipant} onClose={() => setOpenParticipant(false)}>
                <DialogTitle>Add Participant</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Select User</InputLabel>
                        <Select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            label="Select User"
                        >
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.username}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenParticipant(false)}>Cancel</Button>
                    <Button onClick={handleAddParticipant} variant="contained" color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openBarrel} onClose={() => setOpenBarrel(false)}>
                <DialogTitle>Add Barrel</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Select Barrel</InputLabel>
                        <Select
                            value={selectedBarrel}
                            onChange={(e) => setSelectedBarrel(e.target.value)}
                            label="Select Barrel"
                        >
                            {barrels.map((barrel) => (
                                <MenuItem key={barrel.id} value={barrel.id}>
                                    {barrel.name} ({barrel.volume}L)
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBarrel(false)}>Cancel</Button>
                    <Button onClick={handleAddBarrel} variant="contained" color="primary">
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 