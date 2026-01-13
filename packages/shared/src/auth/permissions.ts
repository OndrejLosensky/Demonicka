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
