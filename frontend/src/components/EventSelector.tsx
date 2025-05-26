import React, { useState, useEffect } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    Typography,
    Box,
    Chip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import type { Event } from '../types/event';
import { eventService } from '../services/eventService';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { format } from 'date-fns';

export const EventSelector: React.FC = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const { activeEvent, loadActiveEvent } = useActiveEvent();

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

    const handleEventSelect = async (eventId: string) => {
        try {
            // If selecting the active event, do nothing
            if (activeEvent?.id === eventId) {
                handleClose();
                return;
            }

            // If selecting a different event, end the current active event and activate the selected one
            if (activeEvent) {
                await eventService.endEvent(activeEvent.id);
            }
            
            // Create a new event with the same properties
            const selectedEvent = events.find(e => e.id === eventId);
            if (selectedEvent) {
                await eventService.createEvent({
                    name: selectedEvent.name,
                    description: selectedEvent.description || '',
                    startDate: new Date().toISOString(),
                });
            }

            await loadActiveEvent();
            handleClose();
        } catch (error) {
            console.error('Failed to switch event:', error);
        }
    };

    return (
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
                        onClick={() => handleEventSelect(event.id)}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: 0.5,
                            minWidth: '250px',
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
                        </Typography>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}; 