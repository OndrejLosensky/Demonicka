import { Box, Card, PageLoader, Typography, Button } from '@demonicka/ui';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton } from '@mui/material';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../../../contexts/AuthContext';
import { userDashboardService } from '../../../services/userDashboardService';
import { galleryService, type GalleryPhoto } from '../../../services/galleryService';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { notify } from '../../../notifications/notify';
import { USER_ROLE } from '@demonicka/shared-types';

export function UserDashboardEventGallery() {
  const { username, id: eventId } = useParams<{ username: string; id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const eventDetailQuery = useQuery({
    queryKey: ['userDashboardEventDetail', username, eventId],
    queryFn: () => userDashboardService.getEventDetail(username!, eventId!),
    enabled: Boolean(username && eventId),
    staleTime: 60_000,
  });

  const photosQuery = useQuery({
    queryKey: ['galleryPhotos', eventId],
    queryFn: () => galleryService.listPhotos(eventId!),
    enabled: Boolean(eventId),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, caption: c }: { file: File; caption?: string }) =>
      galleryService.uploadPhoto(eventId!, file, c),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos', eventId] });
      setCaption('');
      setSelectedFile(null);
      setUploadModalOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      notify.success('Foto bylo nahráno.');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      notify.error(err?.response?.data?.message ?? 'Nepodařilo se nahrát foto.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => galleryService.deletePhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos', eventId] });
      notify.success('Foto bylo smazáno.');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      notify.error(err?.response?.data?.message ?? 'Nepodařilo se smazat foto.');
    },
  });

  const canDeletePhoto = (photo: GalleryPhoto) =>
    user && (photo.userId === user.id || user.role === USER_ROLE.SUPER_ADMIN);

  const event = eventDetailQuery.data?.event;
  const photos: GalleryPhoto[] = photosQuery.data ?? [];

  const handleUpload = () => {
    if (!selectedFile) {
      notify.error('Vyberte soubor.');
      return;
    }
    uploadMutation.mutate({ file: selectedFile, caption: caption || undefined });
  };

  if (eventDetailQuery.isLoading) return <PageLoader message="Načítání události..." />;
  if (eventDetailQuery.isError || !event || !username) {
    return (
      <Card>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Nepodařilo se načíst událost
        </Typography>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Card sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() =>
              navigate(`/u/${encodeURIComponent(username)}/dashboard/events/${eventId}`)
            }
            sx={{ textTransform: 'none' }}
          >
            Zpět na událost
          </Button>
          <Button
            variant="contained"
            startIcon={<AddPhotoAlternateIcon />}
            onClick={() => {
              setCaption('');
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
              setUploadModalOpen(true);
            }}
          >
            Přidat foto
          </Button>
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Galerie: {event.name}
        </Typography>

        {photosQuery.isLoading && <PageLoader message="Načítání fotek..." />}
        {photosQuery.isError && (
          <Typography color="error">Nepodařilo se načíst fotky.</Typography>
        )}
        {photosQuery.isSuccess && (
          <Grid container spacing={2}>
            {photos.length === 0 ? (
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
                  <Typography>Zatím žádné fotky v této události.</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddPhotoAlternateIcon />}
                    onClick={() => setUploadModalOpen(true)}
                    sx={{ mt: 1 }}
                  >
                    Přidat první foto
                  </Button>
                </Box>
              </Grid>
            ) : (
              photos.map((photo) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
                  <Box
                    sx={{
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.default',
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

      <Dialog
        open={uploadModalOpen}
        onClose={() => !uploadMutation.isPending && setUploadModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Přidat foto</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Událost: <strong>{event.name}</strong>
          </Typography>
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
            disabled={uploadMutation.isPending || !selectedFile}
          >
            {uploadMutation.isPending ? 'Nahrávám…' : 'Nahrát'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
