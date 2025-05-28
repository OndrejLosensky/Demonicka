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
import type { User } from '../types/user';
import type { Barrel } from '../types/barrel';
import { eventService } from '../services/eventService';
import { userService } from '../services/userService';
import { barrelService } from '../services/barrelService';
import { format } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../types/featureFlags';

export const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
    const [openUser, setOpenUser] = useState(false);
    const [openBarrel, setOpenBarrel] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedBarrel, setSelectedBarrel] = useState('');
    const { loadActiveEvent } = useActiveEvent();
    const showActiveEventFunctionality = useFeatureFlag(FeatureFlagKey.ACTIVE_EVENT_FUNCTIONALITY);

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

    const handleAddUser = async () => {
        try {
            if (id && selectedUser) {
                await eventService.addUser(id, selectedUser);
                await loadEventData();
                setOpenUser(false);
                setSelectedUser('');
            }
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            if (id) {
                await eventService.removeUser(id, userId);
                await loadEventData();
            }
        } catch (error) {
            console.error('Failed to remove user:', error);
        }
    };

    const handleAddBarrel = async () => {
        try {
            if (id && selectedBarrel) {
                await eventService.addBarrel(id, selectedBarrel);
                await loadEventData();
                setOpenBarrel(false);
                setSelectedBarrel('');
            }
        } catch (error) {
            console.error('Failed to add barrel:', error);
        }
    };

    const handleRemoveBarrel = async (barrelId: string) => {
        try {
            if (id) {
                await eventService.removeBarrel(id, barrelId);
                await loadEventData();
            }
        } catch (error) {
            console.error('Failed to remove barrel:', error);
        }
    };

    const handleSetActive = async () => {
        try {
            if (id) {
                await eventService.setActive(id);
                await loadActiveEvent();
            }
        } catch (error) {
            console.error('Failed to set event as active:', error);
        }
    };

    const handleEndEvent = async () => {
        try {
            if (id) {
                await eventService.endEvent(id);
                await loadEventData();
                await loadActiveEvent();
            }
        } catch (error) {
            console.error('Failed to end event:', error);
        }
    };

    if (!event) {
        return (
            <Container>
                <Typography>Loading...</Typography>
            </Container>
        );
    }

    const availableUsers = users.filter(
        user => !event.users?.some(eventUser => eventUser.id === user.id)
    );

    const availableBarrels = barrels.filter(
        barrel => !event.barrels?.some(eventBarrel => eventBarrel.id === barrel.id)
    );

    return (
        <Container>
            <Box mb={4}>
                <Typography variant="h4" gutterBottom>
                    {event.name}
                </Typography>
                <Typography variant="body1" color="textSecondary" gutterBottom>
                    {event.description}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Start: {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm')}
                    {event.endDate && ` | End: ${format(new Date(event.endDate), 'dd.MM.yyyy HH:mm')}`}
                </Typography>
                {showActiveEventFunctionality && (
                    <Box mt={2}>
                        {event.isActive ? (
                            <>
                                <Chip color="success" label="Active Event" sx={{ mr: 1 }} />
                                <Button variant="outlined" color="warning" onClick={handleEndEvent}>
                                    End Event
                                </Button>
                            </>
                        ) : (
                            <Button variant="contained" color="primary" onClick={handleSetActive}>
                                Set as Active
                            </Button>
                        )}
                    </Box>
                )}
            </Box>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <Box p={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Users</Typography>
                                <Button variant="contained" onClick={() => setOpenUser(true)}>
                                    Add User
                                </Button>
                            </Box>
                            <List>
                                {event.users?.map(user => (
                                    <ListItem
                                        key={user.id}
                                        secondaryAction={
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleRemoveUser(user.id)}
                                            >
                                                Remove
                                            </Button>
                                        }
                                    >
                                        <ListItemText
                                            primary={user.name}
                                            secondary={`Beers: ${user.beerCount}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <Box p={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Barrels</Typography>
                                <Button variant="contained" onClick={() => setOpenBarrel(true)}>
                                    Add Barrel
                                </Button>
                            </Box>
                            <List>
                                {event.barrels?.map(barrel => (
                                    <ListItem
                                        key={barrel.id}
                                        secondaryAction={
                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleRemoveBarrel(barrel.id)}
                                            >
                                                Remove
                                            </Button>
                                        }
                                    >
                                        <ListItemText
                                            primary={`${barrel.size}l - ${barrel.brand}`}
                                            secondary={`Status: ${barrel.status}`}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={openUser} onClose={() => setOpenUser(false)}>
                <DialogTitle>Add User</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Select User</InputLabel>
                        <Select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            label="Select User"
                        >
                            {availableUsers.map(user => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUser(false)}>Cancel</Button>
                    <Button onClick={handleAddUser} variant="contained" disabled={!selectedUser}>
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
                            {availableBarrels.map(barrel => (
                                <MenuItem key={barrel.id} value={barrel.id}>
                                    {`${barrel.size}l - ${barrel.brand}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBarrel(false)}>Cancel</Button>
                    <Button onClick={handleAddBarrel} variant="contained" disabled={!selectedBarrel}>
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 