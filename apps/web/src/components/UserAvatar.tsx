import { Avatar } from '@mui/material';
import type { User } from '@demonicka/shared-types';
import type { ComponentProps } from 'react';
import { config } from '../config/index';

interface UserAvatarProps extends Omit<ComponentProps<typeof Avatar>, 'src' | 'children'> {
  user: User | { username: string; profilePictureUrl?: string | null; googleProfilePictureUrl?: string | null; name?: string };
  getInitials?: (user: { username: string; name?: string }) => string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  getInitials,
  sx,
  ...avatarProps
}) => {
  const getDefaultInitials = (user: { username: string; name?: string }): string => {
    if (user.name) {
      // Try to get initials from name
      const nameParts = user.name.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      }
      return user.name.charAt(0).toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  const initials = getInitials ? getInitials(user) : getDefaultInitials(user);
  
  // Priority: 1. User's uploaded profile picture, 2. Google profile picture, 3. None
  const profilePictureUrl = user.profilePictureUrl;
  const googleProfilePictureUrl = 'googleProfilePictureUrl' in user ? user.googleProfilePictureUrl : null;
  const pictureUrl = profilePictureUrl || googleProfilePictureUrl;

  // Construct full URL if pictureUrl is relative
  // Use API URL instead of window.location.origin since API runs on different port
  const imageSrc = pictureUrl
    ? pictureUrl.startsWith('http')
      ? pictureUrl
      : `${config.apiUrl}${pictureUrl}`
    : undefined;

  return (
    <Avatar
      src={imageSrc || undefined}
      sx={{
        bgcolor: 'primary.main',
        ...sx,
      }}
      {...avatarProps}
    >
      {!imageSrc && initials}
    </Avatar>
  );
};
