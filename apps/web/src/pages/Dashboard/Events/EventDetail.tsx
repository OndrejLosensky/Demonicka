import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Menu,
    LinearProgress,
    Chip,
    Paper,
    FilterAlt as FilterIcon,
    Add as AddIcon,
    TrendingUp as TrendingUpIcon,
    LocalBar as BeerIcon,
    Group as GroupIcon,
    Timer as TimeIcon,
    Storage as BarrelIcon,
    MetricCard,
    Delete as DeleteIcon,
    IconButton,
    SportsBar as SportsBarIcon,
    Save as SaveIcon,
    TextField,
    HowToReg as HowToRegIcon,
    ContentCopy as ContentCopyIcon,
    LinkIcon,
} from '@demonicka/ui';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventService } from '../../../services/eventService';
import { userService } from '../../../services/userService';
import { eventBeerPongTeamService } from '../../../services/beerPongService';
import type { Event, User, Barrel, EventBeerPongTeam, CreateTeamDto } from '@demonicka/shared-types';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { tokens } from '../../../theme/tokens';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Permission } from '@demonicka/shared';
import { UserAvatar } from '../../../components/UserAvatar';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';
import { notify } from '../../../notifications/notify';

export const EventDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [users, setUsers] = useState<User[]>([]); // Event users
    const [allUsers, setAllUsers] = useState<User[]>([]); // All available users for adding to event
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, number>>({});
    const [eventTeams, setEventTeams] = useState<EventBeerPongTeam[]>([]);
    const [openUser, setOpenUser] = useState(false);
    const [openTeam, setOpenTeam] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
    const [deleteEventOpen, setDeleteEventOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isManagingRegistration, setIsManagingRegistration] = useState(false);
    const [registrationLink, setRegistrationLink] = useState<string | null>(null);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);
    const [teamForm, setTeamForm] = useState<CreateTeamDto>({
        name: '',
        player1Id: '',
        player2Id: '',
    });
    const [isUpdatingConfig, setIsUpdatingConfig] = useState(false);
    const [editStartDate, setEditStartDate] = useState<string | null>(null);
    const [editEndDate, setEditEndDate] = useState<string | null>(null);
    const [editBeerPrice, setEditBeerPrice] = useState<number | null>(null);
    const { loadActiveEvent } = useActiveEvent();
    const { hasPermission } = useAuth();

    const loadEventData = useCallback(async () => {
        if (!id) return;
        try {
            const data = await eventService.getEvent(id);
            setEvent(data);
        } catch (error) {
            console.error('Failed to load event:', error);
            notify.error('Nepodařilo se načíst událost', { id: `event:load:${id}` });
        }
    }, [id]);

    const loadUsers = useCallback(async () => {
        if (!id) return;
        try {
            // Load only event users, not all users
            const data = await eventService.getEventUsers(id);
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
            notify.error('Nepodařilo se načíst účastníky události', { id: `event:users:load:${id}` });
        }
    }, [id]);

    const loadAllUsers = useCallback(async () => {
        try {
            // Load all users for the "Add User" dialog
            const data = await userService.getAllUsers(false); // Exclude deleted users
            setAllUsers(data);
        } catch (error) {
            console.error('Failed to load all users:', error);
            // Don't show error toast - this is just for the dialog
        }
    }, []);

    const loadEventTeams = useCallback(async () => {
        if (!id) return;
        try {
            const teams = await eventBeerPongTeamService.getByEvent(id);
            setEventTeams(teams);
        } catch (error) {
            console.error('Failed to load event teams:', error);
            // Don't show error - teams might not exist yet
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadEventData();
            loadUsers();
            loadEventTeams();
        }
        // Load all users for the "Add User" dialog
        loadAllUsers();
    }, [id, loadEventData, loadUsers, loadEventTeams, loadAllUsers]);

    const loadEventBeerCounts = useCallback(async () => {
        if (!id || !users.length) return;
        const counts: Record<string, number> = {};
        await Promise.all(
            users.map(async (user) => {
                try {
                    // Use eventBeerCount from user if available, otherwise fetch it
                    if (user.eventBeerCount !== undefined) {
                        counts[user.id] = user.eventBeerCount;
                    } else {
                        const count = await eventService.getUserEventBeerCount(id, user.id);
                        counts[user.id] = count;
                    }
                } catch (error) {
                    console.error(`Failed to load beer count for user ${user.id}:`, error);
                }
            })
        );
        setEventBeerCounts(counts);
    }, [id, users]);

    useEffect(() => {
        if (id && users.length) {
            loadEventBeerCounts();
        }
    }, [id, users, loadEventBeerCounts]);

    // removed duplicate function definitions after converting to useCallback

    const handleAddUser = async () => {
        try {
            if (id && selectedUser) {
                const toastId = `event:user:add:${id}:${selectedUser}`;
                await notify.action(
                  {
                    id: toastId,
                    success: 'Účastník byl přidán',
                    error: (err) => {
                      const msg = notify.fromError(err);
                      return msg === 'Něco se pokazilo' ? 'Nepodařilo se přidat účastníka' : msg;
                    },
                  },
                  () => eventService.addUser(id, selectedUser),
                );
                await loadEventData();
                setOpenUser(false);
                setSelectedUser('');
            }
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    };

    const handleCreateTeam = async () => {
        if (!id) return;
        try {
            if (!teamForm.name.trim()) {
                notify.error('Název týmu je povinný', { id: 'team:validation:name' });
                return;
            }
            if (!teamForm.player1Id || !teamForm.player2Id) {
                notify.error('Oba hráči musí být vybráni', { id: 'team:validation:players' });
                return;
            }
            if (teamForm.player1Id === teamForm.player2Id) {
                notify.error('Hráči musí být rozdílní', { id: 'team:validation:distinct' });
                return;
            }
            await eventBeerPongTeamService.create(id, teamForm);
            await loadEventTeams();
            setOpenTeam(false);
            setTeamForm({ name: '', player1Id: '', player2Id: '' });
            notify.success('Tým byl vytvořen', { id: `team:create:${id}` });
        } catch (error: any) {
            console.error('Failed to create team:', error);
            notify.error(notify.fromError(error) || 'Nepodařilo se vytvořit tým', { id: `team:create:${id}` });
        }
    };

    const handleDeleteTeam = async () => {
        if (!id || !deleteTeamId) return;
        try {
            await eventBeerPongTeamService.delete(id, deleteTeamId);
            await loadEventTeams();
            setDeleteTeamId(null);
            notify.success('Tým byl smazán', { id: `team:delete:${id}:${deleteTeamId}` });
        } catch (error: any) {
            console.error('Failed to delete team:', error);
            notify.error(notify.fromError(error) || 'Nepodařilo se smazat tým', {
                id: `team:delete:${id}:${deleteTeamId}`,
            });
        }
    };

    const handleToggleEventConfig = useCallback(
        async (field: 'beerPongEnabled' | 'beerSizesEnabled', value: boolean) => {
            if (!id || !event || event.isActive) return;
            setIsUpdatingConfig(true);
            try {
                await notify.action(
                    {
                        id: `event:config:${id}:${field}`,
                        success: 'Nastavení bylo uloženo',
                        error: (err) => notify.fromError(err),
                    },
                    () => eventService.updateEvent(id, { [field]: value }),
                );
                await loadEventData();
                await loadActiveEvent();
            } catch {
                // Error already shown by notify.action
            } finally {
                setIsUpdatingConfig(false);
            }
        },
        [id, event?.isActive, loadEventData, loadActiveEvent]
    );

    const handleUpdateEvent = useCallback(
        async (payload: Partial<Event>) => {
            if (!id || !event || event.isActive) return;
            try {
                await notify.action(
                    {
                        id: `event:update:${id}`,
                        success: 'Změny byly uloženy',
                        error: (err) => notify.fromError(err),
                    },
                    () => eventService.updateEvent(id, payload),
                );
                await loadEventData();
                await loadActiveEvent();
                setEditStartDate(null);
                setEditEndDate(null);
                setEditBeerPrice(null);
            } catch {
                // Error already shown
            }
        },
        [id, event?.isActive, loadEventData, loadActiveEvent]
    );

    const handleDeleteEvent = async () => {
        if (!id) return;
        try {
            setIsDeleting(true);
            await notify.action(
              {
                id: `event:delete:${id}`,
                success: 'Událost byla úspěšně smazána',
                error: (err) => {
                  const msg = notify.fromError(err);
                  return msg === 'Něco se pokazilo' ? 'Nepodařilo se smazat událost' : msg;
                },
              },
              () => eventService.deleteEvent(id),
            );
            navigate('/dashboard/events');
        } catch (error: any) {
            console.error('Failed to delete event:', error);
        } finally {
            setIsDeleting(false);
            setDeleteEventOpen(false);
        }
    };

    const handleSetActive = async () => {
        if (!id) return;
        
        try {
            await notify.action(
              {
                id: `event:activate:${id}`,
                success: 'Událost byla úspěšně aktivována',
                error: (err) => {
                  const msg = notify.fromError(err);
                  return msg === 'Něco se pokazilo' ? 'Nepodařilo se aktivovat událost' : msg;
                },
              },
              () => eventService.setActive(id),
            );
            await Promise.all([
                loadEventData(),
                loadActiveEvent()
            ]);
        } catch (error) {
            console.error('Failed to set event as active:', error);
        }
    };

    const handleDeactivate = async () => {
        if (!id) return;
        
        try {
            await notify.action(
              {
                id: `event:deactivate:${id}`,
                success: 'Událost byla úspěšně deaktivována',
                error: (err) => {
                  const msg = notify.fromError(err);
                  return msg === 'Něco se pokazilo' ? 'Nepodařilo se deaktivovat událost' : msg;
                },
              },
              () => eventService.deactivate(id),
            );
            await Promise.all([
                loadEventData(),
                loadActiveEvent()
            ]);
        } catch (error) {
            console.error('Failed to deactivate event:', error);
        }
    };

    const handleEvaluateEvent = async () => {
        if (!id || !event) return;
        
        try {
            // End the event first
            await notify.action(
              {
                id: `event:finish:${id}`,
                success: 'Událost byla úspěšně ukončena a vyhodnocena',
                error: (err) => {
                  const msg = notify.fromError(err);
                  return msg === 'Něco se pokazilo' ? 'Nepodařilo se vyhodnotit událost' : msg;
                },
              },
              () => eventService.endEvent(id),
            );
            
            // Navigate to results page
            navigate(`/dashboard/events/${id}/results`);
            
            // Reload data
            await Promise.all([
                loadEventData(),
                loadActiveEvent()
            ]);
        } catch (error) {
            console.error('Failed to evaluate event:', error);
        }
    };

    const safeFileName = (base: string): string => {
        const trimmed = base.trim() || 'export';
        const sanitized = trimmed.replace(/[^a-zA-Z0-9._-]+/g, '_');
        return sanitized.replace(/^_+|_+$/g, '') || 'export';
    };

    const handleOpenRegistration = async () => {
        if (!id) return;
        try {
            setIsManagingRegistration(true);
            const result = await eventService.openRegistration(id);
            const fullLink = `${window.location.origin}${result.link}`;
            setRegistrationLink(fullLink);
            setShowLinkDialog(true);
            loadEventData();
            notify.success('Registrace otevřena', { id: `event:registration:open:${id}` });
        } catch (error) {
            console.error('Failed to open registration:', error);
            notify.error('Nepodařilo se otevřít registraci', { id: `event:registration:open:${id}` });
        } finally {
            setIsManagingRegistration(false);
        }
    };

    const handleCloseRegistration = async () => {
        if (!id) return;
        try {
            setIsManagingRegistration(true);
            await eventService.closeRegistration(id);
            loadEventData();
            notify.success('Registrace uzavřena', { id: `event:registration:close:${id}` });
        } catch (error) {
            console.error('Failed to close registration:', error);
            notify.error('Nepodařilo se uzavřít registraci', { id: `event:registration:close:${id}` });
        } finally {
            setIsManagingRegistration(false);
        }
    };

    const handleCopyLink = () => {
        if (registrationLink) {
            navigator.clipboard.writeText(registrationLink);
            notify.success('Odkaz zkopírován do schránky');
        }
    };

    const handleExportEventDetailExcel = async () => {
        if (!id || !event) return;

        try {
            setIsExportingExcel(true);
            await notify.action(
              {
                id: `event:export:${id}`,
                success: 'Excel export stažen',
                error: (err) => {
                  const msg = notify.fromError(err);
                  return msg === 'Něco se pokazilo' ? 'Nepodařilo se stáhnout Excel export' : msg;
                },
              },
              async () => {
                const blob = await eventService.downloadEventDetailExcel(id);

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${safeFileName(`${event.name}_event_detail`)}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              },
            );
        } catch (error) {
            console.error('Failed to export event detail excel:', error);
        } finally {
            setIsExportingExcel(false);
        }
    };

    const headerLeft = useMemo(
        () =>
            event?.isActive ? (
                <Chip
                    label="Aktivní"
                    size="small"
                    color="success"
                    sx={{
                        fontWeight: 600,
                        height: 24,
                    }}
                />
            ) : undefined,
        [event?.isActive],
    );

    const hasMoreMenuItems =
        hasPermission([Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS]) ||
        hasPermission([Permission.VIEW_BEERS, Permission.VIEW_LEADERBOARD]) ||
        hasPermission([Permission.DELETE_EVENT]);

    const headerAction = useMemo(
        () => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {hasPermission([Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS]) && (
                    <Button
                        variant="outlined"
                        startIcon={<HowToRegIcon />}
                        onClick={() => navigate(`/dashboard/events/${id}/registration`)}
                        sx={{ borderRadius: tokens.borderRadius.md }}
                    >
                        Kontrola registrací
                    </Button>
                )}
                <Button
                    variant={event?.isActive ? 'outlined' : 'contained'}
                    color={event?.isActive ? 'error' : 'primary'}
                    startIcon={event?.isActive ? undefined : <AddIcon />}
                    onClick={event?.isActive ? handleDeactivate : handleSetActive}
                    sx={{ borderRadius: tokens.borderRadius.md }}
                    disabled={!event}
                >
                    {event?.isActive ? 'Deaktivovat' : 'Aktivovat'}
                </Button>
                {event?.isActive && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<TrendingUpIcon />}
                        onClick={handleEvaluateEvent}
                        sx={{ borderRadius: tokens.borderRadius.md }}
                    >
                        Vyhodnotit
                    </Button>
                )}
                {hasMoreMenuItems && (
                    <>
                        <IconButton
                            aria-label="Další akce"
                            onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                            sx={{ borderRadius: 1 }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                        <Menu
                            anchorEl={moreMenuAnchor}
                            open={Boolean(moreMenuAnchor)}
                            onClose={() => setMoreMenuAnchor(null)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            {hasPermission([Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS]) && !event?.registrationEnabled && (
                                <MenuItem
                                    onClick={() => {
                                        handleOpenRegistration();
                                        setMoreMenuAnchor(null);
                                    }}
                                    disabled={isManagingRegistration}
                                >
                                    Otevřít registraci
                                </MenuItem>
                            )}
                            {hasPermission([Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS]) && event?.registrationEnabled && (
                                <MenuItem
                                    onClick={() => {
                                        handleCloseRegistration();
                                        setMoreMenuAnchor(null);
                                    }}
                                    disabled={isManagingRegistration}
                                >
                                    Uzavřít registraci
                                </MenuItem>
                            )}
                            {hasPermission([Permission.MANAGE_EVENT_USERS, Permission.MANAGE_PARTICIPANTS]) && event?.registrationEnabled && event?.registrationToken && (
                                <MenuItem
                                    onClick={() => {
                                        setRegistrationLink(
                                            `${window.location.origin}/register/event/${event.registrationToken}`,
                                        );
                                        setShowLinkDialog(true);
                                        setMoreMenuAnchor(null);
                                    }}
                                >
                                    Zkopírovat odkaz
                                </MenuItem>
                            )}
                            {hasPermission([Permission.VIEW_BEERS, Permission.VIEW_LEADERBOARD]) && (
                                <MenuItem
                                    onClick={() => {
                                        handleExportEventDetailExcel();
                                        setMoreMenuAnchor(null);
                                    }}
                                    disabled={isExportingExcel}
                                >
                                    {isExportingExcel ? 'Exportuji…' : 'Excel export'}
                                </MenuItem>
                            )}
                            {hasPermission([Permission.DELETE_EVENT]) && (
                                <MenuItem
                                    onClick={() => {
                                        setDeleteEventOpen(true);
                                        setMoreMenuAnchor(null);
                                    }}
                                    sx={{ color: 'error.main' }}
                                >
                                    Smazat událost
                                </MenuItem>
                            )}
                        </Menu>
                    </>
                )}
            </Box>
        ),
        [
            navigate,
            id,
            event?.isActive,
            event?.registrationEnabled,
            event?.registrationToken,
            isExportingExcel,
            isManagingRegistration,
            hasPermission,
            hasMoreMenuItems,
            handleOpenRegistration,
            handleCloseRegistration,
            handleExportEventDetailExcel,
            handleDeactivate,
            handleSetActive,
            handleEvaluateEvent,
            moreMenuAnchor,
        ],
    );

    useDashboardHeaderSlots({
        left: headerLeft,
        action: headerAction,
    });

    if (!event) {
        return (
            <Container>
                <Box sx={{ width: '100%', mt: 4 }}>
                    <LinearProgress />
                </Box>
            </Container>
        );
    }

    const totalBeers = Object.values(eventBeerCounts).reduce((sum, count) => sum + count, 0);
    const averageBeersPerUser = users.length ? Number((totalBeers / users.length).toFixed(1)) : 0;

    return (
            <Box sx={{ p: 0 }}>
            {/* Content Section */}
            <Box 
                sx={{ 
                    maxWidth: 1200, 
                    mx: 'auto',
                }}
            >
                <Box sx={{ mb: 2 }}>
                    {event.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {event.description}
                        </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            {editStartDate !== null ? (
                                <TextField
                                    type="datetime-local"
                                    size="small"
                                    value={editStartDate}
                                    onChange={(e) => setEditStartDate(e.target.value)}
                                    onBlur={() => {
                                        if (editStartDate) {
                                            const iso = new Date(editStartDate).toISOString();
                                            if (iso !== event.startDate) handleUpdateEvent({ startDate: iso });
                                        }
                                        setEditStartDate(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setEditStartDate(null);
                                    }}
                                    inputProps={{ style: { fontSize: 14 } }}
                                />
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    onClick={() => !event.isActive && setEditStartDate(new Date(event.startDate).toISOString().slice(0, 16))}
                                    sx={{
                                        cursor: event.isActive ? 'default' : 'pointer',
                                        '&:hover': event.isActive ? {} : { textDecoration: 'underline' },
                                    }}
                                >
                                    {format(new Date(event.startDate), 'PPp', { locale: cs })}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            {editEndDate !== null ? (
                                <TextField
                                    type="datetime-local"
                                    size="small"
                                    value={editEndDate}
                                    onChange={(e) => setEditEndDate(e.target.value)}
                                    onBlur={() => {
                                        if (editEndDate) {
                                            const iso = new Date(editEndDate).toISOString();
                                            if (iso !== event.endDate) handleUpdateEvent({ endDate: iso });
                                        }
                                        setEditEndDate(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Escape') setEditEndDate(null);
                                    }}
                                    inputProps={{ style: { fontSize: 14 } }}
                                />
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    onClick={() => !event.isActive && setEditEndDate(new Date(event.endDate).toISOString().slice(0, 16))}
                                    sx={{
                                        cursor: event.isActive ? 'default' : 'pointer',
                                        '&:hover': event.isActive ? {} : { textDecoration: 'underline' },
                                    }}
                                >
                                    Konec: {format(new Date(event.endDate), 'PPp', { locale: cs })}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                                {users.length || 0} účastníků
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SportsBarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                                Beer pong:{' '}
                            </Typography>
                            {event.isActive ? (
                                <Typography variant="body2" color="text.secondary">
                                    {event.beerPongEnabled !== false ? 'ano' : 'ne'}
                                </Typography>
                            ) : (
                                <Typography
                                    component="button"
                                    variant="body2"
                                    onClick={() => handleToggleEventConfig('beerPongEnabled', event.beerPongEnabled === false)}
                                    disabled={isUpdatingConfig}
                                    sx={{
                                        border: 0,
                                        background: 'none',
                                        cursor: isUpdatingConfig ? 'default' : 'pointer',
                                        color: 'primary.main',
                                        textDecoration: 'underline',
                                        p: 0,
                                        font: 'inherit',
                                    }}
                                >
                                    {event.beerPongEnabled !== false ? 'ano' : 'ne'}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BeerIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                                Malé piva:{' '}
                            </Typography>
                            {event.isActive ? (
                                <Typography variant="body2" color="text.secondary">
                                    {event.beerSizesEnabled !== false ? 'ano' : 'ne'}
                                </Typography>
                            ) : (
                                <Typography
                                    component="button"
                                    variant="body2"
                                    onClick={() => handleToggleEventConfig('beerSizesEnabled', event.beerSizesEnabled === false)}
                                    disabled={isUpdatingConfig}
                                    sx={{
                                        border: 0,
                                        background: 'none',
                                        cursor: isUpdatingConfig ? 'default' : 'pointer',
                                        color: 'primary.main',
                                        textDecoration: 'underline',
                                        p: 0,
                                        font: 'inherit',
                                    }}
                                >
                                    {event.beerSizesEnabled !== false ? 'ano' : 'ne'}
                                </Typography>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Cena piva:{' '}
                            </Typography>
                            {editBeerPrice !== null ? (
                                <TextField
                                    type="number"
                                    size="small"
                                    inputProps={{ min: 0, step: 1, style: { fontSize: 14 } }}
                                    value={editBeerPrice}
                                    onChange={(e) => setEditBeerPrice(parseInt(e.target.value, 10) || 0)}
                                    onBlur={() => {
                                        const num = editBeerPrice ?? event.beerPrice ?? 30;
                                        if (num >= 0 && num !== (event.beerPrice ?? 30)) {
                                            handleUpdateEvent({ beerPrice: num });
                                        }
                                        setEditBeerPrice(null);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                        if (e.key === 'Escape') setEditBeerPrice(null);
                                    }}
                                    sx={{ width: 72 }}
                                />
                            ) : (
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    onClick={() => !event.isActive && setEditBeerPrice(event.beerPrice ?? 30)}
                                    sx={{
                                        cursor: event.isActive ? 'default' : 'pointer',
                                        '&:hover': event.isActive ? {} : { textDecoration: 'underline' },
                                    }}
                                >
                                    {event.beerPrice ?? 30} ,-
                                </Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
                {/* Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Celkem piv" value={totalBeers} icon={<BeerIcon />} color="primary" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Účastníci" value={users.length || 0} icon={<GroupIcon />} color="error" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="průměr / os." value={averageBeersPerUser} icon={<TrendingUpIcon />} color="success" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Sudy" value={event.barrels?.length || 0} icon={<FilterIcon />} color="warning" />
                    </Grid>
                </Grid>

                {/* Rest of the content */}
                <Grid container spacing={3}>
                    {/* Participants Section */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Paper 
                            sx={{ 
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <GroupIcon sx={{ fontSize: 18, color: 'white' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                Účastníci
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {users.length || 0} účastníků
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOpenUser(true)}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        Přidat
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {users.map((user) => (
                                        <Box
                                            key={user.id}
                                            sx={{
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: tokens.transitions.default,
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <UserAvatar
                                                user={user}
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    fontSize: '1rem',
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <Box flex={1} sx={{ minWidth: 0 }}>
                                                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                                                    {user.username}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <BeerIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        {eventBeerCounts[user.id] ?? user.eventBeerCount ?? 0} piv
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Barrels Section */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Paper 
                            sx={{ 
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: 'warning.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <FilterIcon sx={{ fontSize: 18, color: 'white' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                Sudy
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {event.barrels?.length || 0} sudů
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {event.barrels
                                        ?.slice()
                                        .sort((a, b) => (a.orderNumber || 0) - (b.orderNumber || 0))
                                        .map((barrel) => (
                                        <Box
                                            key={barrel.id}
                                            sx={{
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: tokens.transitions.default,
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: 'warning.main',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <BarrelIcon sx={{ fontSize: 20, color: 'white' }} />
                                            </Box>
                                            <Box flex={1} sx={{ minWidth: 0 }}>
                                                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                                                    Sud #{barrel.orderNumber ?? '?'}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <BeerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        {barrel.size ?? 0}L
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {barrel.isActive && (
                                                <Chip 
                                                    label="Aktivní"
                                                    size="small"
                                                    color="success"
                                                    sx={{ flexShrink: 0 }}
                                                />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Beer Pong Teams Section - only when beer pong is enabled for this event */}
                    {event.beerPongEnabled === true && (
                    <Grid item xs={12} md={6} lg={4}>
                        <Paper 
                            sx={{ 
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: 'success.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <SportsBarIcon sx={{ fontSize: 18, color: 'white' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                Beer Pong Týmy
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {eventTeams.length} týmů v poolu
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            setOpenTeam(true);
                                            setTeamForm({ name: '', player1Id: '', player2Id: '' });
                                        }}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        Přidat
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {eventTeams.length === 0 ? (
                                        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                            <Typography variant="body2">
                                                Zatím nejsou vytvořeny žádné týmy. Přidejte tým do event poolu pro použití v turnajích.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        eventTeams.map((team) => (
                                            <Box
                                                key={team.id}
                                                sx={{
                                                    p: 2,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    transition: tokens.transitions.default,
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    },
                                                    position: 'relative',
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setDeleteTeamId(team.id)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 4,
                                                        right: 4,
                                                        color: 'error.main',
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        bgcolor: 'success.main',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <SportsBarIcon sx={{ fontSize: 20, color: 'white' }} />
                                                </Box>
                                                <Box flex={1} sx={{ minWidth: 0, pr: 3 }}>
                                                    <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                                                        {team.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        {team.player1?.username || team.player1?.name || [team.player1?.firstName, team.player1?.lastName].filter(Boolean).join(' ').trim() || 'N/A'} & {team.player2?.username || team.player2?.name || [team.player2?.firstName, team.player2?.lastName].filter(Boolean).join(' ').trim() || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                    )}
                </Grid>
            </Box>

            {/* Dialogs */}
            <Dialog open={openUser} onClose={() => setOpenUser(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Přidat účastníka</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Vyberte účastníka</InputLabel>
                            <Select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                label="Vyberte účastníka"
                            >
                                {allUsers
                                    .filter(user => !users.find(eventUser => eventUser.id === user.id))
                                    .map(user => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.username}
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUser(false)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        color="primary"
                        onClick={handleAddUser}
                        disabled={!selectedUser}
                    >
                        Přidat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Registration Link Dialog */}
            <Dialog open={showLinkDialog} onClose={() => setShowLinkDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Registrační odkaz</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Sdílejte tento odkaz s účastníky, aby se mohli zaregistrovat:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                                fullWidth
                                value={registrationLink || ''}
                                InputProps={{
                                    readOnly: true,
                                }}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                startIcon={<ContentCopyIcon />}
                                onClick={handleCopyLink}
                                variant="outlined"
                            >
                                Kopírovat
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowLinkDialog(false)}>Zavřít</Button>
                </DialogActions>
            </Dialog>

            {/* Create Event Team Dialog */}
            <Dialog open={openTeam} onClose={() => setOpenTeam(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Vytvořit tým v event poolu</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Název týmu"
                            fullWidth
                            required
                            value={teamForm.name}
                            onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Hráč 1</InputLabel>
                            <Select
                                value={teamForm.player1Id}
                                label="Hráč 1"
                                onChange={(e) => setTeamForm((prev) => ({ ...prev, player1Id: e.target.value }))}
                            >
                                {users
                                    .filter(user => user.id !== teamForm.player2Id)
                                    .map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.name || user.firstName || user.username || 'Unknown'}
                                        </MenuItem>
                                    ))
                                }
                                {users.length === 0 && (
                                    <MenuItem disabled>Žádní účastníci v události</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Hráč 2</InputLabel>
                            <Select
                                value={teamForm.player2Id}
                                label="Hráč 2"
                                onChange={(e) => setTeamForm((prev) => ({ ...prev, player2Id: e.target.value }))}
                            >
                                {users
                                    .filter(user => user.id !== teamForm.player1Id)
                                    .map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.name || user.firstName || user.username || 'Unknown'}
                                        </MenuItem>
                                    ))
                                }
                                {users.length === 0 && (
                                    <MenuItem disabled>Žádní účastníci v události</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTeam(false)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        color="primary"
                        onClick={handleCreateTeam}
                        disabled={!teamForm.name.trim() || !teamForm.player1Id || !teamForm.player2Id}
                    >
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Team Confirmation Dialog */}
            <Dialog open={!!deleteTeamId} onClose={() => setDeleteTeamId(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Smazat tým</DialogTitle>
                <DialogContent>
                    <Typography>
                        Opravdu chcete smazat tento tým z event poolu? Tato akce je nevratná.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTeamId(null)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        color="error"
                        onClick={handleDeleteTeam}
                    >
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Event Confirmation Dialog */}
            <Dialog open={deleteEventOpen} onClose={() => !isDeleting && setDeleteEventOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Smazat událost</DialogTitle>
                <DialogContent>
                    <Typography>
                        Opravdu chcete smazat událost "{event.name}"? Tato akce je nevratná a smaže všechny související data.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteEventOpen(false)} disabled={isDeleting}>
                        Zrušit
                    </Button>
                    <Button 
                        variant="contained"
                        color="error"
                        onClick={handleDeleteEvent}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Maže se...' : 'Smazat'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};