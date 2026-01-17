/**
 * Permission definitions for the Démonická application
 * 
 * Permissions are granular access controls that define what actions
 * a user can perform in the system.
 */

export enum Permission {
  // Event permissions
  CREATE_EVENT = 'CREATE_EVENT',
  UPDATE_EVENT = 'UPDATE_EVENT',
  DELETE_EVENT = 'DELETE_EVENT',
  VIEW_ALL_EVENTS = 'VIEW_ALL_EVENTS',
  VIEW_OWN_EVENTS = 'VIEW_OWN_EVENTS',
  MANAGE_EVENT_USERS = 'MANAGE_EVENT_USERS',
  MANAGE_EVENT_BARRELS = 'MANAGE_EVENT_BARRELS',
  SET_EVENT_ACTIVE = 'SET_EVENT_ACTIVE',
  END_EVENT = 'END_EVENT',

  // User management permissions
  MANAGE_USERS = 'MANAGE_USERS',
  CREATE_USER = 'CREATE_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  VIEW_ALL_USERS = 'VIEW_ALL_USERS',

  // Participant management permissions
  MANAGE_PARTICIPANTS = 'MANAGE_PARTICIPANTS',
  CREATE_PARTICIPANT = 'CREATE_PARTICIPANT',
  UPDATE_PARTICIPANT = 'UPDATE_PARTICIPANT',
  DELETE_PARTICIPANT = 'DELETE_PARTICIPANT',

  // Barrel management permissions
  MANAGE_BARRELS = 'MANAGE_BARRELS',
  CREATE_BARREL = 'CREATE_BARREL',
  UPDATE_BARREL = 'UPDATE_BARREL',
  DELETE_BARREL = 'DELETE_BARREL',

  // Beer permissions
  ADD_BEER = 'ADD_BEER',
  REMOVE_BEER = 'REMOVE_BEER',
  VIEW_BEERS = 'VIEW_BEERS',
  MANAGE_BEERS = 'MANAGE_BEERS',

  // Dashboard permissions
  VIEW_DASHBOARD = 'VIEW_DASHBOARD',
  VIEW_SYSTEM_DASHBOARD = 'VIEW_SYSTEM_DASHBOARD',

  // System permissions
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  VIEW_SYSTEM_STATS = 'VIEW_SYSTEM_STATS',
  MANAGE_BACKUPS = 'MANAGE_BACKUPS',

  // Leaderboard permissions
  VIEW_LEADERBOARD = 'VIEW_LEADERBOARD',

  // Achievement permissions
  MANAGE_ACHIEVEMENTS = 'MANAGE_ACHIEVEMENTS',
  VIEW_ACHIEVEMENTS = 'VIEW_ACHIEVEMENTS',

  // Beer Pong permissions
  CREATE_BEER_PONG_EVENT = 'CREATE_BEER_PONG_EVENT',
  UPDATE_BEER_PONG_EVENT = 'UPDATE_BEER_PONG_EVENT',
  DELETE_BEER_PONG_EVENT = 'DELETE_BEER_PONG_EVENT',
  MANAGE_BEER_PONG_TEAMS = 'MANAGE_BEER_PONG_TEAMS',
  START_BEER_PONG_GAME = 'START_BEER_PONG_GAME',
  MANAGE_BEER_PONG_GAME = 'MANAGE_BEER_PONG_GAME',
}

/**
 * Type for permission values
 */
export type PermissionType = Permission;

/**
 * Helper function to check if a value is a valid permission
 */
export function isPermission(value: string): value is Permission {
  return Object.values(Permission).includes(value as Permission);
}

/**
 * Permission descriptions for UI display
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  // Event permissions
  [Permission.CREATE_EVENT]: 'Create new events',
  [Permission.UPDATE_EVENT]: 'Update existing events',
  [Permission.DELETE_EVENT]: 'Delete events',
  [Permission.VIEW_ALL_EVENTS]: 'View all events in the system',
  [Permission.VIEW_OWN_EVENTS]: 'View events user is part of or created',
  [Permission.MANAGE_EVENT_USERS]: 'Manage users in events',
  [Permission.MANAGE_EVENT_BARRELS]: 'Manage barrels in events',
  [Permission.SET_EVENT_ACTIVE]: 'Set event as active',
  [Permission.END_EVENT]: 'End an event',

  // User management permissions
  [Permission.MANAGE_USERS]: 'Manage all users',
  [Permission.CREATE_USER]: 'Create new users',
  [Permission.UPDATE_USER]: 'Update existing users',
  [Permission.DELETE_USER]: 'Delete users',
  [Permission.VIEW_ALL_USERS]: 'View all users in the system',

  // Participant management permissions
  [Permission.MANAGE_PARTICIPANTS]: 'Manage participants',
  [Permission.CREATE_PARTICIPANT]: 'Create new participants',
  [Permission.UPDATE_PARTICIPANT]: 'Update existing participants',
  [Permission.DELETE_PARTICIPANT]: 'Delete participants',

  // Barrel management permissions
  [Permission.MANAGE_BARRELS]: 'Manage all barrels',
  [Permission.CREATE_BARREL]: 'Create new barrels',
  [Permission.UPDATE_BARREL]: 'Update existing barrels',
  [Permission.DELETE_BARREL]: 'Delete barrels',

  // Beer permissions
  [Permission.ADD_BEER]: 'Add beer to events',
  [Permission.REMOVE_BEER]: 'Remove beer from events',
  [Permission.VIEW_BEERS]: 'View beer data',
  [Permission.MANAGE_BEERS]: 'Manage all beer data',

  // Dashboard permissions
  [Permission.VIEW_DASHBOARD]: 'View dashboard',
  [Permission.VIEW_SYSTEM_DASHBOARD]: 'View system dashboard',

  // System permissions
  [Permission.MANAGE_SYSTEM]: 'Manage system settings',
  [Permission.VIEW_SYSTEM_STATS]: 'View system statistics',
  [Permission.MANAGE_BACKUPS]: 'Manage system backups',

  // Leaderboard permissions
  [Permission.VIEW_LEADERBOARD]: 'View leaderboard',

  // Achievement permissions
  [Permission.MANAGE_ACHIEVEMENTS]: 'Manage achievements',
  [Permission.VIEW_ACHIEVEMENTS]: 'View achievements',

  // Beer Pong permissions
  [Permission.CREATE_BEER_PONG_EVENT]: 'Create new beer pong tournaments',
  [Permission.UPDATE_BEER_PONG_EVENT]: 'Update beer pong tournaments',
  [Permission.DELETE_BEER_PONG_EVENT]: 'Delete beer pong tournaments',
  [Permission.MANAGE_BEER_PONG_TEAMS]: 'Manage teams in beer pong tournaments',
  [Permission.START_BEER_PONG_GAME]: 'Start beer pong games (triggers beer addition)',
  [Permission.MANAGE_BEER_PONG_GAME]: 'Manage beer pong games (mark winners, undo)',
};
