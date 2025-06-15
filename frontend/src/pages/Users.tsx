import React, { useState, useEffect } from 'react';
import type { User } from '../types/user';
import {
    Container,
    Typography,
    Card,
    Box,
    Switch,
    FormControlLabel,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
    LocalBar as BeerIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { userService } from '../services/userService';
import { eventService } from '../services/eventService';

export const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, number>>({});
    const { activeEvent } = useActiveEvent();

    useEffect(() => {
        loadUsers();
    }, [showDeleted]);

    useEffect(() => {
        if (activeEvent) {
            loadEventBeerCounts();
        } else {
            setEventBeerCounts({});
        }
    }, [activeEvent]);

    const loadUsers = async () => {
        try {
            const data = await userService.getAllUsers(showDeleted);
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const loadEventBeerCounts = async () => {
        if (!activeEvent) return;
        
        try {
            const counts: Record<string, number> = {};
            await Promise.all(
                users.map(async (user) => {
                    const count = await eventService.getUserEventBeerCount(activeEvent.id, user.id);
                    counts[user.id] = count;
                })
            );
            setEventBeerCounts(counts);
        } catch (error) {
            console.error('Failed to load event beer counts:', error);
        }
    };

    const handleAddBeer = async (userId: string) => {
        try {
            if (activeEvent) {
                await eventService.addBeerToUser(activeEvent.id, userId);
                await loadEventBeerCounts();
            }
        } catch (error) {
            console.error('Failed to add beer:', error);
        }
    };

    const handleRemoveBeer = async (userId: string) => {
        try {
            if (activeEvent) {
                await eventService.removeBeerFromUser(activeEvent.id, userId);
                await loadEventBeerCounts();
            }
        } catch (error) {
            console.error('Failed to remove beer:', error);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await userService.deleteUser(userId);
            await loadUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    return (
        <Container maxWidth="xl">
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" component="h1">Účastníci</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showDeleted}
                                onChange={(e) => setShowDeleted(e.target.checked)}
                            />
                        }
                        label="Zobrazit smazané"
                    />
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                    >
                        Vyčistit vše
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Přidat účastníka
                    </Button>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
                <Card sx={{ p: 3, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">Muži</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {users.filter(user => user.gender === 'MALE').length}
                    </Typography>
                </Card>
                <Card sx={{ p: 3, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">Ženy</Typography>
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                        {users.filter(user => user.gender === 'FEMALE').length}
                    </Typography>
                </Card>
            </Box>

            <TableContainer component={Card}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Uživatelské jméno</TableCell>
                            <TableCell>Piva</TableCell>
                            <TableCell>Pohlaví</TableCell>
                            <TableCell>Poslední pivo</TableCell>
                            <TableCell align="right">Akce</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.username}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <BeerIcon sx={{ color: 'text.secondary' }} />
                                        <Typography>{eventBeerCounts[user.id] || 0}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={user.gender === 'MALE' ? 'Muž' : 'Žena'}
                                        size="small"
                                        sx={{ 
                                            bgcolor: user.gender === 'MALE' ? '#EEF2FF' : '#FCE7F3',
                                            color: user.gender === 'MALE' ? '#6366F1' : '#DB2777',
                                        }}
                                    />
                                </TableCell>
                                <TableCell>
                                    {user.lastBeerTime ? format(new Date(user.lastBeerTime), 'MMM d, yyyy, HH:mm') : '-'}
                                </TableCell>
                                <TableCell align="right">
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                        <IconButton 
                                            size="small"
                                            onClick={() => handleRemoveBeer(user.id)}
                                            disabled={!activeEvent || (eventBeerCounts[user.id] || 0) === 0}
                                        >
                                            <RemoveIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small"
                                            onClick={() => handleAddBeer(user.id)}
                                            disabled={!activeEvent}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="error"
                                            onClick={() => handleDeleteUser(user.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}; 