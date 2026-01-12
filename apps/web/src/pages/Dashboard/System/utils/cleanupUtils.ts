import { api } from '../../../../services/api';

export interface CleanupOptions {
  system?: boolean;
  activeEvent?: boolean;
  participants?: boolean;
  users?: boolean;
  barrels?: boolean;
  events?: boolean;
}

export interface CleanupResult {
  success: boolean;
  message: string;
  deletedCount?: number;
}

/**
 * System-wide cleanup - removes old logs, temporary files, etc.
 */
export const systemCleanup = async (): Promise<CleanupResult> => {
  try {
    const response = await api.post('/logs/cleanup', {
      olderThan: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
    });
    
    return {
      success: true,
      message: `Systém vyčištěn. Smazáno ${response.data.deletedCount} starých logů.`,
      deletedCount: response.data.deletedCount,
    };
  } catch (error) {
    console.error('System cleanup failed:', error);
    return {
      success: false,
      message: 'Nepodařilo se vyčistit systém.',
    };
  }
};

/**
 * Cleanup active event - removes all data related to the current active event
 */
export const activeEventCleanup = async (): Promise<CleanupResult> => {
  try {
    // First get the active event
    const activeEventResponse = await api.get('/events/active');
    if (!activeEventResponse.data) {
      return {
        success: false,
        message: 'Není aktivní událost k vyčištění.',
      };
    }

    const eventId = activeEventResponse.data.id;
    
    // Remove all event beers
    await api.delete(`/events/${eventId}/beers`);
    
    // Remove all participants from the event
    const participantsResponse = await api.get(`/events/${eventId}/users`);
    for (const participant of participantsResponse.data) {
      await api.delete(`/events/${eventId}/users/${participant.id}`);
    }
    
    return {
      success: true,
      message: `Aktivní událost "${activeEventResponse.data.name}" vyčištěna.`,
    };
  } catch (error) {
    console.error('Active event cleanup failed:', error);
    return {
      success: false,
      message: 'Nepodařilo se vyčistit aktivní událost.',
    };
  }
};

/**
 * Cleanup participants - removes all participants (users with role PARTICIPANT)
 */
export const participantsCleanup = async (): Promise<CleanupResult> => {
  try {
    await api.post('/users/cleanup');
    
    return {
      success: true,
      message: 'Všichni účastníci byli smazáni.',
    };
  } catch (error) {
    console.error('Participants cleanup failed:', error);
    return {
      success: false,
      message: 'Nepodařilo se smazat účastníky.',
    };
  }
};

/**
 * Cleanup users - removes all users (including admins)
 */
export const usersCleanup = async (): Promise<CleanupResult> => {
  try {
    // Get all users
    const usersResponse = await api.get('/users');
    const users = usersResponse.data;
    
    let deletedCount = 0;
    for (const user of users) {
      try {
        await api.delete(`/users/${user.id}`);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete user ${user.id}:`, error);
      }
    }
    
    return {
      success: true,
      message: `Smazáno ${deletedCount} uživatelů.`,
      deletedCount,
    };
  } catch (error) {
    console.error('Users cleanup failed:', error);
    return {
      success: false,
      message: 'Nepodařilo se smazat uživatele.',
    };
  }
};

/**
 * Cleanup barrels - removes all barrels
 */
export const barrelsCleanup = async (): Promise<CleanupResult> => {
  try {
    await api.post('/barrels/cleanup');
    
    return {
      success: true,
      message: 'Všechny sudy byly smazány.',
    };
  } catch (error) {
    console.error('Barrels cleanup failed:', error);
    return {
      success: false,
      message: 'Nepodařilo se smazat sudy.',
    };
  }
};

/**
 * Cleanup events - removes all events
 */
export const eventsCleanup = async (): Promise<CleanupResult> => {
  try {
    await api.post('/events/cleanup');
    
    return {
      success: true,
      message: 'Všechny události byly smazány.',
    };
  } catch (error) {
    console.error('Events cleanup failed:', error);
    return {
      success: false,
      message: 'Nepodařilo se smazat události.',
    };
  }
};

/**
 * Complete system cleanup - removes everything
 */
export const completeSystemCleanup = async (): Promise<CleanupResult> => {
  try {
    const results = await Promise.allSettled([
      systemCleanup(),
      activeEventCleanup(),
      participantsCleanup(),
      usersCleanup(),
      barrelsCleanup(),
      eventsCleanup(),
    ]);
    
    const successfulResults = results.filter(
      (result) => result.status === 'fulfilled' && result.value.success
    );
    
    return {
      success: successfulResults.length > 0,
      message: `Kompletní vyčištění dokončeno. Úspěšně provedeno ${successfulResults.length} operací.`,
    };
  } catch (error) {
    console.error('Complete system cleanup failed:', error);
    return {
      success: false,
      message: 'Nepodařilo se provést kompletní vyčištění systému.',
    };
  }
}; 