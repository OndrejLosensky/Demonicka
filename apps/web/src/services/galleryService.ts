import { api } from './api';
import { config } from '../config/index';

export type GalleryPhotoUser = {
  id: string;
  username: string;
  name: string | null;
};

export type GalleryPhoto = {
  id: string;
  eventId: string;
  userId: string;
  caption: string | null;
  order: number | null;
  createdAt: string;
  user: GalleryPhotoUser;
};

export type GalleryPhotoWithEvent = GalleryPhoto & { eventName: string };

export const galleryService = {
  listPhotos(eventId: string): Promise<GalleryPhoto[]> {
    return api.get(`/gallery/events/${eventId}/photos`).then((r) => r.data);
  },

  /** List current user's photos across all their events, optionally filtered by eventId. */
  listMyPhotos(eventId?: string): Promise<GalleryPhotoWithEvent[]> {
    const params = eventId ? { eventId } : {};
    return api.get('/gallery/photos', { params }).then((r) => r.data);
  },

  uploadPhoto(eventId: string, file: File, caption?: string): Promise<GalleryPhoto> {
    const formData = new FormData();
    formData.append('file', file);
    if (caption != null) formData.append('caption', caption);
    return api
      .post(`/gallery/events/${eventId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  getPhotoImageUrl(photoId: string): string {
    return `${config.apiUrl}${config.apiPrefix}/gallery/photos/${photoId}/image`;
  },

  deletePhoto(photoId: string): Promise<void> {
    return api.delete(`/gallery/photos/${photoId}`).then(() => undefined);
  },
};
