import { config } from '../config';
import { api } from './api';
import type { ApiError } from './api';

const BASE = config.apiBaseUrl;

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

export function getPhotoImageUrl(photoId: string): string {
  return `${config.apiUrl}${config.apiPrefix}/gallery/photos/${photoId}/image`;
}

export async function listMyPhotos(
  token: string | null,
  eventId?: string
): Promise<GalleryPhotoWithEvent[]> {
  const path = eventId ? `/gallery/photos?eventId=${encodeURIComponent(eventId)}` : '/gallery/photos';
  return api.get<GalleryPhotoWithEvent[]>(path, token);
}

export async function listPhotosByEvent(
  eventId: string,
  token: string | null
): Promise<GalleryPhoto[]> {
  return api.get<GalleryPhoto[]>(`/gallery/events/${eventId}/photos`, token);
}

/**
 * Upload a photo. uri is the local file URI from ImagePicker (e.g. file:// or content://).
 */
export async function uploadPhoto(
  eventId: string,
  uri: string,
  token: string | null,
  caption?: string
): Promise<GalleryPhoto> {
  const path = `${BASE}/gallery/events/${encodeURIComponent(eventId)}/photos`;
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  if (caption != null) formData.append('caption', caption);

  const headers: Record<string, string> = {
    'x-api-version': '1',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Do NOT set Content-Type - React Native sets multipart/form-data with boundary

  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = (await res.json().catch(() => ({}))) as GalleryPhoto & { message?: string };
  if (!res.ok) {
    const err = new Error((data as { message?: string }).message ?? 'Nahrání se nezdařilo') as ApiError;
    (err as ApiError).status = res.status;
    (err as ApiError).data = data;
    throw err;
  }
  return data;
}

export async function deletePhoto(photoId: string, token: string | null): Promise<void> {
  await api.delete(`/gallery/photos/${photoId}`, token);
}
