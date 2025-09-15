import React, { useState } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { profilePictureService } from '../../services/profilePictureService';
import { ProfilePictureDialog } from './ProfilePictureDialog';

interface ProfilePictureUploadProps {
  currentPicture?: string | null;
  username: string;
  onPictureChange: (filename: string | null) => void;
  size?: number;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  username,
  onPictureChange,
  size = 120,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const getProfilePictureUrl = () => {
    if (currentPicture) {
      return profilePictureService.getProfilePictureUrl(currentPicture);
    }
    return null;
  };

  return (
    <>
      <Box position="relative" display="inline-block">
        <Avatar
          src={getProfilePictureUrl() || undefined}
          sx={{
            width: size,
            height: size,
            fontSize: `${size * 0.4}px`,
            bgcolor: 'primary.main',
            boxShadow: 3,
          }}
        >
          {!currentPicture && username[0].toUpperCase()}
        </Avatar>

        <Box
          position="absolute"
          bottom={-5}
          right={-5}
          display="flex"
          gap={0.5}
        >
          <Tooltip title="Upravit profilový obrázek">
            <IconButton
              size="small"
              onClick={() => setDialogOpen(true)}
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'background.default' },
              }}
            >
              <PhotoCameraIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <ProfilePictureDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onPictureChange={onPictureChange}
        currentPicture={currentPicture}
      />
    </>
  );
};
