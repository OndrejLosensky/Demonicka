import React, { useState, useEffect } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    Typography,
    Box,
    Chip,
    Alert,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import type { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { format } from 'date-fns';

export const EventSelector: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const { activeEvent } = useActiveEvent();
    const { selectedEvent, setSelectedEvent, isViewingHistory } = useSelectedEvent();

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

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEventSelect = (event: Event) => {
        setSelectedEvent(event);
        handleClose();
    };

    const handleBackToActive = () => {
        if (activeEvent) {
            setSelectedEvent(activeEvent);
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexDirection: 'column' }}>
            {isViewingHistory && (
                <Alert 
                    severity="info" 
                    sx={{ mb: 2, width: '100%' }}
                    action={
                        <Button color="inherit" size="small" onClick={handleBackToActive}>
                            Zpět na aktivní událost
                        </Button>
                    }
                >
                    Prohlížíte historická data pro událost: <strong>{selectedEvent?.name}</strong>
                </Alert>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                    onClick={handleClick}
                    startIcon={<HistoryIcon />}
                    variant="outlined"
                    size="small"
                >
                    Historie událostí
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {events.map((event) => (
                        <MenuItem
                            key={event.id}
                            onClick={() => handleEventSelect(event)}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 0.5,
                                minWidth: '250px',
                                backgroundColor: selectedEvent?.id === event.id ? 'action.selected' : 'transparent',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                                <Typography variant="body1">{event.name}</Typography>
                                {event.isActive && (
                                    <Chip
                                        label="Aktivní"
                                        color="primary"
                                        size="small"
                                        sx={{ ml: 'auto' }}
                                    />
                                )}
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                                {format(new Date(event.startDate), 'PPpp')}
                                {event.endDate && ` - ${format(new Date(event.endDate), 'PPpp')}`}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Účastníci: {event.participants.length} | Sudy: {event.barrels.length}
                            </Typography>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
        </Box>
    );
}; 