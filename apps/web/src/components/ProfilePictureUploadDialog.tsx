import { useState, useRef, ChangeEvent, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Avatar,
  Alert,
  Slider,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { LoadingButton } from '@demonicka/ui';
import { profileApi } from '../pages/Dashboard/Profile/api';
import { tokens } from '../theme/tokens';

interface ProfilePictureUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentImageUrl?: string | null;
  userName: string;
}

export const ProfilePictureUploadDialog: React.FC<ProfilePictureUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
  currentImageUrl,
  userName,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(150); // Default 150% (1.5x)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Neplatný formát souboru. Povolené formáty: JPEG, PNG, WebP, GIF.');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Soubor je příliš velký. Maximální velikost je 5MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setImagePosition({ x: 0, y: 0 }); // Reset position when new file is selected
    setZoom(150); // Reset zoom to default

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!selectedFile) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedFile || !cropContainerRef.current) return;
    
    const container = cropContainerRef.current;
    const rect = container.getBoundingClientRect();
    const cropSize = Math.min(rect.width, rect.height);
    
    // Calculate new position: current mouse position minus initial offset
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Limit movement based on zoom level
    // When zoomed in more, allow more movement
    const zoomFactor = zoom / 100; // 1.5 for 150%
    const maxMovement = (zoomFactor - 1) * cropSize * 0.5; // e.g., 150% = 75px max movement
    
    setImagePosition({
      x: Math.max(-maxMovement, Math.min(maxMovement, newX)),
      y: Math.max(-maxMovement, Math.min(maxMovement, newY)),
    });
  }, [isDragging, selectedFile, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const cropAndUploadImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx || !cropContainerRef.current) {
          reject(new Error('Canvas context or container not available'));
          return;
        }

        // Crop container size (300x300 in preview)
        const cropSize = 300;
        canvas.width = 400;
        canvas.height = 400;

        // Image is displayed at zoom% size in preview
        // Calculate the scale factor between preview and actual image
        const previewImageSize = cropSize * (zoom / 100); // e.g., 150% = 450px
        const scaleX = img.width / previewImageSize;
        const scaleY = img.height / previewImageSize;

        // Calculate the center of the image in preview coordinates
        const previewImageCenter = previewImageSize / 2;
        
        // The crop container is 300px, so its center is at 150px from preview image top-left
        // The offset from crop center to image center is (imagePosition.x, imagePosition.y)
        // So the crop area in preview coordinates starts at:
        const cropStartX = previewImageCenter - cropSize / 2 - imagePosition.x;
        const cropStartY = previewImageCenter - cropSize / 2 - imagePosition.y;

        // Convert preview coordinates to actual image coordinates
        const sourceX = Math.max(0, Math.min(img.width - cropSize * scaleX, cropStartX * scaleX));
        const sourceY = Math.max(0, Math.min(img.height - cropSize * scaleY, cropStartY * scaleY));
        const sourceWidth = Math.min(img.width - sourceX, cropSize * scaleX);
        const sourceHeight = Math.min(img.height - sourceY, cropSize * scaleY);
        
        // Draw cropped and positioned image
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          400,
          400
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          const croppedFile = new File([blob], file.name, { type: 'image/png' });
          resolve(croppedFile);
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Crop and position the image before uploading
      const croppedFile = await cropAndUploadImage(selectedFile);
      await profileApi.uploadProfilePicture(croppedFile);
      handleClose();
      onSuccess();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || 'Chyba při nahrávání obrázku. Zkuste to znovu.';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const displayPreview = previewUrl || currentImageUrl;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: tokens.borderRadius.md,
        },
      }}
    >
      <DialogTitle>Nahrát profilový obrázek</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {selectedFile && previewUrl ? (
              <Box
                ref={cropContainerRef}
                sx={{
                  width: 300,
                  height: 300,
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '50%',
                  border: '2px solid',
                  borderColor: 'divider',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  mb: 2,
                }}
                onMouseDown={handleMouseDown}
              >
                <Box
                  component="img"
                  src={previewUrl}
                  alt="Preview"
                  sx={{
                    position: 'absolute',
                    width: `${zoom}%`,
                    height: `${zoom}%`,
                    objectFit: 'cover',
                    transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                    pointerEvents: 'none',
                  }}
                />
              </Box>
            ) : (
              <Avatar
                src={displayPreview || undefined}
                sx={{
                  width: 150,
                  height: 150,
                  bgcolor: 'primary.main',
                  fontSize: '3rem',
                }}
              >
                {!displayPreview && userName.charAt(0).toUpperCase()}
              </Avatar>
            )}

            <Typography variant="body2" color="text.secondary" textAlign="center">
              {selectedFile
                ? `Vybraný soubor: ${selectedFile.name}`
                : 'Vyberte obrázek z vašeho zařízení'}
            </Typography>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={handleBrowseClick}
              disabled={isUploading}
              size="large"
            >
              Vybrat soubor
            </Button>

            {selectedFile && previewUrl && (
              <Box sx={{ width: '100%', maxWidth: 400, mt: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Přiblížení: {zoom}%
                </Typography>
                <Slider
                  value={zoom}
                  onChange={(e, newValue) => setZoom(newValue as number)}
                  min={100}
                  max={300}
                  step={10}
                  marks={[
                    { value: 100, label: '100%' },
                    { value: 150, label: '150%' },
                    { value: 200, label: '200%' },
                    { value: 300, label: '300%' },
                  ]}
                  aria-label="Zoom"
                />
              </Box>
            )}

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Povolené formáty: JPEG, PNG, WebP, GIF. Maximální velikost: 5MB.
              <br />
              {selectedFile && 'Klikněte a táhněte obrázek pro změnu pozice. '}
              Obrázek bude automaticky převeden do formátu WebP a optimalizován.
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={isUploading} variant="outlined" size="large">
          Zrušit
        </Button>
        <LoadingButton
          onClick={handleUpload}
          disabled={!selectedFile}
          variant="contained"
          color="primary"
          size="large"
          loading={isUploading}
          loadingText="Nahrávání..."
        >
          Nahrát
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
};
