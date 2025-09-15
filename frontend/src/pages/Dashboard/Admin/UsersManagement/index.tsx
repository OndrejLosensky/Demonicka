import React, { useState, useEffect, useCallback } from 'react';
import type { User } from '../../../../types/user';
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
    Grid,
} from '@mui/material';
import {
    Add as AddIcon,
    Remove as RemoveIcon,
    Delete as DeleteIcon,
    LocalBar as BeerIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useActiveEvent } from '../../../../contexts/ActiveEventContext';
import { userService } from '../../../../services/userService';
import { eventService } from '../../../../services/eventService';
import { usePageTitle } from '../../../../hooks/usePageTitle';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { MetricCard } from '../../../../components/ui/MetricCard';

export const UsersManagement: React.FC = () => {
    usePageTitle('Správa uživatelů');
    const [users, setUsers] = useState<User[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, number>>({});
    const { activeEvent } = useActiveEvent();

    const loadUsers = useCallback(async () => {
        try {
            const data = await userService.getAllUsers(showDeleted);
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }, [showDeleted]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const loadEventBeerCounts = useCallback(async () => {
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
    }, [activeEvent, users]);

    useEffect(() => {
        if (activeEvent) {
            loadEventBeerCounts();
        } else {
            setEventBeerCounts({});
        }
    }, [activeEvent, loadEventBeerCounts]);

    // duplicate functions removed after useCallback conversion

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
            <PageHeader
                title="Správa uživatelů"
                action={
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
                }
            />

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                    <MetricCard title="Muži" value={users.filter(user => user.gender === 'MALE').length} />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <MetricCard title="Ženy" value={users.filter(user => user.gender === 'FEMALE').length} color="info" />
                </Grid>
            </Grid>

            <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
                <Table stickyHeader size="small">
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
