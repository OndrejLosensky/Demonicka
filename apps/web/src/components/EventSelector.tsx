import React, { useState, useEffect } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    Typography,
    Box,
    Chip,
    Alert,
    IconButton,
    Tooltip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import UndoIcon from '@mui/icons-material/Undo';
import type { Event } from '@demonicka/shared-types';
import { eventService } from '../services/eventService';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useSelectedEvent } from '../contexts/SelectedEventContext';
import { format } from 'date-fns';

type EventSelectorProps = {
    variant?: 'default' | 'compact';
};

export const EventSelector: React.FC<EventSelectorProps> = ({ variant = 'default' }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const { activeEvent, loadActiveEvent } = useActiveEvent();
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

    const handleEventSelect = async (event: Event) => {
        setSelectedEvent(event);
        if (event.isActive) {
            await loadActiveEvent();
        }
        handleClose();
    };

    const handleBackToActive = async () => {
        if (activeEvent) {
            setSelectedEvent(activeEvent);
            await loadActiveEvent();
        }
    };

    const trigger = variant === 'compact' ? (
        <Tooltip title="Historie událostí">
            <IconButton
                onClick={handleClick}
                size="small"
                sx={{
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
            >
                <HistoryIcon fontSize="small" />
            </IconButton>
        </Tooltip>
    ) : (
        <Button
            onClick={handleClick}
            startIcon={<HistoryIcon />}
            variant="outlined"
            size="small"
        >
            Historie událostí
        </Button>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexDirection: variant === 'compact' ? 'row' : 'column',
            }}
        >
            {isViewingHistory && variant === 'default' && (
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

            {isViewingHistory && variant === 'compact' && (
                <Chip
                    size="small"
                    color="info"
                    variant="outlined"
                    label={selectedEvent?.name ? `Historie: ${selectedEvent.name}` : 'Historie'}
                    onDelete={activeEvent ? handleBackToActive : undefined}
                    deleteIcon={<UndoIcon />}
                    sx={{ maxWidth: 220 }}
                />
            )}

            {trigger}

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
                            Účastníci: {event.users.length} | Sudy: {event.barrels.length}
                        </Typography>
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}; 