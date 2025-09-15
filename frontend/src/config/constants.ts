// App-wide constants configuration
export const APP_CONFIG = {
  // App metadata
  APP_NAME: 'Demonicka',
  APP_VERSION: '1.0.0',
  
  // API configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  API_TIMEOUT: 10000,
  
  // Pagination defaults
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,
  
  // Query client defaults
  QUERY_RETRY_COUNT: 1,
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_CACHE_TIME: 10 * 60 * 1000, // 10 minutes
  
  // UI constants
  SIDEBAR_WIDTH: 240,
  SIDEBAR_COLLAPSED_WIDTH: 64,
  TOP_NAVIGATION_HEIGHT: 56,
  
  // Animation durations
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Breakpoints
  BREAKPOINTS: {
    XS: 0,
    SM: 600,
    MD: 900,
    LG: 1200,
    XL: 1536,
  },
} as const;

// Route paths constants
export const ROUTES = {
  // Public routes
  HOME: '/',
  LEADERBOARD: '/leaderboard',
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  COMPLETE_REGISTRATION: '/complete-registration',
  ENTER_TOKEN: '/enter-token',
  
  // Dashboard routes
  DASHBOARD: '/dashboard',
  DASHBOARD_PARTICIPANTS: '/dashboard/participants',
  DASHBOARD_BARRELS: '/dashboard/barrels',
  DASHBOARD_SYSTEM: '/dashboard/system',
  
  // Admin routes
  ACTIVITY: '/activity',
  EVENTS: '/events',
  EVENT_DETAIL: (id: string) => `/events/${id}`,
  EVENT_RESULTS: (id: string) => `/events/${id}/results`,
  DOCS: '/docs',
  
  // Shared routes
  PROFILE: '/profile',
  ACHIEVEMENTS: '/achievements',
  
  // User routes
  USER_DASHBOARD: (userId: string) => `/${userId}/dashboard`,
} as const;

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: [
    'dashboard',
    'events',
    'users',
    'system',
    'activity',
    'docs',
    'barrels',
    'participants',
    'profile',
    'achievements',
  ],
  [USER_ROLES.USER]: [
    'profile',
    'achievements',
    'leaderboard',
  ],
} as const;

// Event types and statuses
export const EVENT_TYPES = {
  BEER_TASTING: 'BEER_TASTING',
  COMPETITION: 'COMPETITION',
  SOCIAL: 'SOCIAL',
} as const;

export const EVENT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Activity log types
export const ACTIVITY_TYPES = {
  BEER_ADDED: 'BEER_ADDED',
  BEER_REMOVED: 'BEER_REMOVED',
  USER_JOINED: 'USER_JOINED',
  USER_LEFT: 'USER_LEFT',
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_UPDATED: 'EVENT_UPDATED',
  EVENT_DELETED: 'EVENT_DELETED',
} as const;

// Achievement categories
export const ACHIEVEMENT_CATEGORIES = {
  BEGINNER: 'BEGINNER',
  INTERMEDIATE: 'INTERMEDIATE',
  ADVANCED: 'ADVANCED',
  EXPERT: 'EXPERT',
  LEGENDARY: 'LEGENDARY',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    COMPLETE_REGISTRATION: '/auth/complete-registration',
    ENTER_TOKEN: '/auth/enter-token',
  },
  
  // Users
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    STATS: '/users/stats',
  },
  
  // Events
  EVENTS: {
    BASE: '/events',
    DETAIL: (id: string) => `/events/${id}`,
    RESULTS: (id: string) => `/events/${id}/results`,
    ACTIVATE: (id: string) => `/events/${id}/activate`,
  },
  
  // Dashboard
  DASHBOARD: {
    OVERVIEW: '/dashboard/overview',
    PUBLIC: '/dashboard/public',
    LEADERBOARD: '/dashboard/leaderboard',
    HOURLY_STATS: '/dashboard/hourly-stats',
  },
  
  // Activity
  ACTIVITY: {
    LOGS: '/activity/logs',
    LOG_DETAIL: (id: string) => `/activity/logs/${id}`,
    STATS: '/activity/stats',
  },
  
  // System
  SYSTEM: {
    HEALTH: '/system/health',
    INFO: '/system/info',
    CONFIG: '/system/config',
  },
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  THEME: 'theme',
  LANGUAGE: 'language',
  LAST_ACTIVE_EVENT: 'last_active_event',
} as const;

// Toast messages
export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: 'Úspěšně přihlášen',
    LOGOUT: 'Úspěšně odhlášen',
    REGISTRATION: 'Registrace dokončena',
    EVENT_CREATED: 'Událost vytvořena',
    EVENT_UPDATED: 'Událost aktualizována',
    EVENT_DELETED: 'Událost smazána',
    USER_CREATED: 'Uživatel vytvořen',
    USER_UPDATED: 'Uživatel aktualizován',
    USER_DELETED: 'Uživatel smazán',
  },
  ERROR: {
    LOGIN_FAILED: 'Přihlášení se nezdařilo',
    NETWORK_ERROR: 'Chyba sítě',
    UNAUTHORIZED: 'Neautorizovaný přístup',
    FORBIDDEN: 'Přístup zamítnut',
    NOT_FOUND: 'Stránka nenalezena',
    SERVER_ERROR: 'Chyba serveru',
    VALIDATION_ERROR: 'Chyba validace',
  },
} as const;

// Form validation rules
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  EVENT_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 100,
  },
} as const;

// Date and time formats
export const DATE_FORMATS = {
  DISPLAY: 'dd.MM.yyyy',
  DISPLAY_WITH_TIME: 'dd.MM.yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: 'yyyy-MM-dd HH:mm:ss',
  TIME_ONLY: 'HH:mm',
} as const;

// Export types for TypeScript
export type AppConfig = typeof APP_CONFIG;
export type Routes = typeof ROUTES;
export type UserRoles = typeof USER_ROLES;
export type EventTypes = typeof EVENT_TYPES;
export type EventStatus = typeof EVENT_STATUS;
export type ActivityTypes = typeof ACTIVITY_TYPES;
export type AchievementCategories = typeof ACHIEVEMENT_CATEGORIES;
export type ApiEndpoints = typeof API_ENDPOINTS;
export type StorageKeys = typeof STORAGE_KEYS;
export type ToastMessages = typeof TOAST_MESSAGES;
export type ValidationRules = typeof VALIDATION_RULES;
export type DateFormats = typeof DATE_FORMATS;
