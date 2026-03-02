/**
 * Abstraction for file storage (S3). Used by profile pictures and future gallery.
 * Objects are private; use getPresignedUrl to grant temporary read access.
 */
export const STORAGE_SERVICE = Symbol('STORAGE_SERVICE');

export interface IStorageService {
  /**
   * Upload a buffer. Returns the S3 object key (e.g. demonicka/profile-pictures/{userId}.webp).
   * Store this key in DB; resolve to presigned URL when serving to clients.
   */
  upload(buffer: Buffer, key: string, contentType: string): Promise<string>;

  /**
   * Delete object by key. No-op if key does not exist.
   */
  delete(key: string): Promise<void>;

  /**
   * Return a short-lived presigned URL for GET. Use for private objects.
   * @param expiresInSeconds Default 3600 (1 hour).
   */
  getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Get a readable stream of the object body for proxying. Use for private objects.
   * @throws if key does not exist
   */
  getObjectStream(
    key: string,
  ): Promise<{ stream: NodeJS.ReadableStream; contentType?: string }>;
}
