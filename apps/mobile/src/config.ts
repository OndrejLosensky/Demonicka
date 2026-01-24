const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const wsUrl = process.env.EXPO_PUBLIC_WS_URL ?? 'http://localhost:3000';
const apiPrefix = process.env.EXPO_PUBLIC_API_PREFIX ?? '/api';

export const config = {
  apiUrl,
  wsUrl,
  apiPrefix,
  apiBaseUrl: `${apiUrl}${apiPrefix}`,
} as const;
