// Debug environment variables
console.log('Environment Variables:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_API_PREFIX: import.meta.env.VITE_API_PREFIX,
  NODE_ENV: import.meta.env.MODE,
});

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  apiPrefix: import.meta.env.VITE_API_PREFIX || '/api',
  analytics: {
    enabled: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  }
} as const;

// Validate required environment variables
const requiredEnvVars = ['VITE_API_URL', 'VITE_WS_URL'] as const;
for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
} 