const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const wsUrl = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000';
const apiPrefix = process.env.EXPO_PUBLIC_API_PREFIX ?? '/api';
/** Web app origin for registration links (complete-registration page). Set EXPO_PUBLIC_WEB_APP_URL if different from API. */
const webAppUrl = process.env.EXPO_PUBLIC_WEB_APP_URL ?? apiUrl;

export const config = {
  apiUrl,
  wsUrl,
  apiPrefix,
  apiBaseUrl: `${apiUrl}${apiPrefix}`,
  webAppUrl,
} as const;

// When running on a physical device or emulator, "localhost" is the device itself,
// not your dev machine. Set EXPO_PUBLIC_API_URL to your machine's IP (e.g. http://192.168.1.5:3000).
if (__DEV__ && typeof apiUrl === 'string' && (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1'))) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Config] API URL uses localhost. On device/emulator this will not reach your server. ' +
      'Set EXPO_PUBLIC_API_URL to your computer IP (e.g. http://192.168.1.x:3000).'
  );
}
