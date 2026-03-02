import { Box, Card, PageLoader, Typography, Button } from '@demonicka/ui';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useMemo } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../../contexts/AuthContext';
import { userDashboardService } from '../../../services/userDashboardService';
import { eventService } from '../../../services/eventService';
import { galleryService, type GalleryPhotoWithEvent } from '../../../services/galleryService';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { notify } from '../../../notifications/notify';
import { USER_ROLE } from '@demonicka/shared-types';

const FILTER_ALL = '';

type EventOption = { eventId: string; eventName: string };

export function GalleryPage() {
  const { username } = useParams<{ username: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isStaff = user?.role === USER_ROLE.SUPER_ADMIN || user?.role === USER_ROLE.OPERATOR;

  const [eventFilter, setEventFilter] = useState<string>(FILTER_ALL);
  const [onlyMine, setOnlyMine] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadEventId, setUploadEventId] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userEventsQuery = useQuery({
    queryKey: ['userDashboardEvents', username],
    queryFn: () => userDashboardService.getEvents(username!),
    enabled: Boolean(username) && !isStaff,
    staleTime: 60_000,
  });

  const allEventsQuery = useQuery({
    queryKey: ['allEvents'],
    queryFn: () => eventService.getAllEvents(),
    enabled: isStaff,
    staleTime: 60_000,
  });

  const events: EventOption[] = useMemo(() => {
    if (isStaff && allEventsQuery.data) {
      return allEventsQuery.data.map((e) => ({ eventId: e.id, eventName: e.name }));
    }
    if (!isStaff && userEventsQuery.data?.events) {
      return userEventsQuery.data.events.map((e) => ({
        eventId: e.eventId,
        eventName: e.eventName,
      }));
    }
    return [];
  }, [isStaff, allEventsQuery.data, userEventsQuery.data]);

  const photosQuery = useQuery({
    queryKey: ['galleryMyPhotos', eventFilter || 'all'],
    queryFn: () => galleryService.listMyPhotos(eventFilter || undefined),
    enabled: true,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ eventId, file, caption: c }: { eventId: string; file: File; caption?: string }) =>
      galleryService.uploadPhoto(eventId, file, c),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryMyPhotos'] });
      setCaption('');
      setSelectedFile(null);
      setUploadModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      notify.success('Foto bylo nahráno.');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      const msg = err?.response?.data?.message ?? 'Nepodařilo se nahrát foto.';
      notify.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => galleryService.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryMyPhotos'] });
      notify.success('Foto bylo smazáno.');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      notify.error(err?.response?.data?.message ?? 'Nepodařilo se smazat foto.');
    },
  });

  const canDeletePhoto = (photo: GalleryPhotoWithEvent) =>
    user && (photo.userId === user.id || user.role === USER_ROLE.SUPER_ADMIN);

  const photos: GalleryPhotoWithEvent[] = photosQuery.data ?? [];
  const filteredPhotos = useMemo(
    () => (onlyMine && user ? photos.filter((p) => p.userId === user.id) : photos),
    [photos, onlyMine, user?.id],
  );

  const handleOpenUpload = () => {
    setCaption('');
    setSelectedFile(null);
    setUploadEventId(eventFilter && eventFilter !== FILTER_ALL ? eventFilter : events[0]?.eventId ?? '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadModalOpen(true);
  };

  const handleUpload = () => {
    if (!uploadEventId || !selectedFile) {
      notify.error('Vyberte událost a soubor.');
      return;
    }
    uploadMutation.mutate({ eventId: uploadEventId, file: selectedFile, caption: caption || undefined });
  };

  const eventsLoading = isStaff ? allEventsQuery.isLoading : userEventsQuery.isLoading;
  const eventsError = isStaff ? allEventsQuery.isError : userEventsQuery.isError;

  if (eventsLoading) return <PageLoader message="Načítání událostí..." />;
  if (eventsError || (!isStaff && !username)) {
    return (
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Nepodařilo se načíst události
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Zkuste to prosím znovu později.
        </Typography>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Card sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Galerie
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isStaff
                ? 'Fotky ze všech událostí. Vyberte událost pro filtr nebo pro nahrání.'
                : 'Fotky z vašich událostí. Vyberte událost pro filtr nebo pro nahrání.'}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={handleOpenUpload}
            disabled={events.length === 0}
            sx={{ flexShrink: 0 }}
          >
            Přidat foto
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Událost</InputLabel>
              <Select
                value={eventFilter}
                label="Událost"
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <MenuItem value={FILTER_ALL}>Všechny události</MenuItem>
                {events.map((e) => (
                  <MenuItem key={e.eventId} value={e.eventId}>
                    {e.eventName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={onlyMine}
                onChange={(_, checked) => setOnlyMine(checked)}
                size="small"
              />
            }
            label="Přidané mnou"
          />
        </Box>

        {photosQuery.isLoading && <PageLoader message="Načítání fotek..." />}
        {photosQuery.isError && (
          <Typography color="error">Nepodařilo se načíst fotky.</Typography>
        )}
        {photosQuery.isSuccess && (
          <Grid container spacing={2}>
            {filteredPhotos.length === 0 ? (
              <Grid item xs={12}>
                <Box
                  sx={{
                    py: 4,
                    textAlign: 'center',
                    color: 'text.secondary',
                    border: '1px dashed',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Typography>
                    {onlyMine ? 'Nemáte žádné vlastní fotky.' : 'Zatím žádné fotky.'}
                  </Typography>
                  {events.length > 0 && (
                    <Button
                      variant="outlined"
                      startIcon={<AddPhotoAlternateIcon />}
                      onClick={handleOpenUpload}
                      sx={{ mt: 1 }}
                    >
                      Přidat první foto
                    </Button>
                  )}
                </Box>
              </Grid>
            ) : (
              filteredPhotos.map((photo) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
                  <Box
                    sx={{
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
                      transition: 'box-shadow 0.2s',
                      position: 'relative',
                      '&:hover': { boxShadow: 2 },
                    }}
                  >
                    <Box
                      component="img"
                      src={galleryService.getPhotoImageUrl(photo.id)}
                      alt={photo.caption ?? 'Foto'}
                      sx={{
                        width: '100%',
                        height: 200,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {canDeletePhoto(photo) && (
                      <IconButton
                        className="gallery-photo-delete"
                        size="small"
                        aria-label="Smazat foto"
                        onClick={() => deleteMutation.mutate(photo.id)}
                        disabled={deleteMutation.isPending}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'error.main',
                            color: 'error.contrastText',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    <Box sx={{ p: 1.25 }}>
                      {eventFilter === FILTER_ALL && (
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'inline-block',
                            mb: 0.5,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: 0.5,
                            bgcolor: 'action.hover',
                            color: 'text.secondary',
                          }}
                        >
                          {photo.eventName}
                        </Typography>
                      )}
                      {photo.caption && (
                        <Typography variant="body2" sx={{ mb: 0.5 }} noWrap>
                          {photo.caption}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {photo.user.name ?? photo.user.username} ·{' '}
                        {format(new Date(photo.createdAt), 'd.M.yyyy HH:mm', { locale: cs })}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Card>

      {/* Upload modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={() => !uploadMutation.isPending && setUploadModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Přidat foto</DialogTitle>
        <DialogContent>
          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Nahrát do události</InputLabel>
            <Select
              value={uploadEventId}
              label="Nahrát do události"
              onChange={(e) => setUploadEventId(e.target.value)}
              disabled={uploadMutation.isPending}
            >
              <MenuItem value="">— vyberte událost —</MenuItem>
              {events.map((e) => (
                <MenuItem key={e.eventId} value={e.eventId}>
                  {e.eventName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            style={{ display: 'none' }}
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            fullWidth
            sx={{ mb: 2 }}
          >
            {selectedFile ? selectedFile.name : 'Vybrat soubor'}
          </Button>
          <TextField
            size="small"
            label="Popisek (volitelné)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            fullWidth
            multiline
            rows={2}
            disabled={uploadMutation.isPending}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUploadModalOpen(false)} disabled={uploadMutation.isPending}>
            Zrušit
          </Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !uploadEventId || !selectedFile}
          >
            {uploadMutation.isPending ? 'Nahrávám…' : 'Nahrát'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
