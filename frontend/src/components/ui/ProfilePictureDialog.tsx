import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Slider,
} from '@mui/material';
import {
  Close as CloseIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Crop as CropIcon,
} from '@mui/icons-material';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { profilePictureService } from '../../services/profilePictureService';
import { useToast } from '../../hooks/useToast';

interface ProfilePictureDialogProps {
  open: boolean;
  onClose: () => void;
  onPictureChange: (filename: string | null) => void;
  currentPicture?: string | null;
}

const ASPECT_RATIO = 1; // Square crop for profile pictures
const MIN_DIMENSION = 150;

export const ProfilePictureDialog: React.FC<ProfilePictureDialogProps> = ({
  open,
  onClose,
  onPictureChange,
  currentPicture,
}) => {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
  const blobUrlRef = useRef<string>();
  const { success, error: showError } = useToast();

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        ASPECT_RATIO,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.match(/^image\/(jpg|jpeg|png|gif)$/)) {
        setError('Pouze obrázky (JPG, PNG, GIF) jsou povoleny');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Soubor je příliš velký. Maximální velikost je 5MB');
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(file);
    }
  };

  const onDownloadCropClick = useCallback(async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const image = imgRef.current;
      const canvas = previewCanvasRef.current;
      const crop = completedCrop;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('No 2d context');
      }

      const pixelRatio = window.devicePixelRatio;
      canvas.width = crop.width * pixelRatio * scaleX;
      canvas.height = crop.height * pixelRatio * scaleY;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width * scaleX,
        crop.height * scaleY
      );

      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }

        const file = new File([blob], 'profile-picture.jpg', {
          type: 'image/jpeg',
        });

        const response = await profilePictureService.uploadProfilePicture(file);
        onPictureChange(response.filename);
        success('Profilový obrázek byl úspěšně nahrán');
        onClose();
      }, 'image/jpeg', 0.9);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Chyba při nahrávání obrázku';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [completedCrop, onPictureChange, onClose, success, showError]);

  const handleRemovePicture = async () => {
    setIsUploading(true);
    setError(null);

    try {
      await profilePictureService.removeProfilePicture();
      onPictureChange(null);
      success('Profilový obrázek byl odstraněn');
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Chyba při odstraňování obrázku';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setRotate(0);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Upravit profilový obrázek</Typography>
          <IconButton onClick={handleClose} disabled={isUploading}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box>
          {!imgSrc ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              minHeight={400}
              border="2px dashed"
              borderColor="grey.300"
              borderRadius={2}
              p={4}
            >
              <CropIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Vyberte obrázek pro úpravu
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                Podporované formáty: JPG, PNG, GIF (max. 5MB)
              </Typography>
              <Button
                variant="contained"
                component="label"
                disabled={isUploading}
              >
                Vybrat soubor
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={onSelectFile}
                />
              </Button>
            </Box>
          ) : (
            <Box>
              <Box display="flex" justifyContent="center" mb={3}>
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={ASPECT_RATIO}
                  minWidth={MIN_DIMENSION}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: '400px',
                      maxWidth: '100%',
                    }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              </Box>

              {/* Controls */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Zoom: {Math.round(scale * 100)}%
                </Typography>
                <Box display="flex" alignItems="center" gap={2}>
                  <ZoomOutIcon />
                  <Slider
                    value={scale}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onChange={(_, value) => setScale(value as number)}
                    sx={{ flex: 1 }}
                  />
                  <ZoomInIcon />
                </Box>
              </Box>

              {/* Hidden canvas for processing */}
              <canvas
                ref={previewCanvasRef}
                style={{
                  display: 'none',
                }}
              />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          Zrušit
        </Button>
        {currentPicture && (
          <Button
            onClick={handleRemovePicture}
            disabled={isUploading}
            color="error"
          >
            {isUploading ? <CircularProgress size={20} /> : 'Odstranit'}
          </Button>
        )}
        {imgSrc && (
          <Button
            onClick={onDownloadCropClick}
            disabled={!completedCrop || isUploading}
            variant="contained"
          >
            {isUploading ? <CircularProgress size={20} /> : 'Uložit'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
