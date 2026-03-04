import type { ActivityLogEntry, ActivityEventType, ActivityUserRef, ActivityAppSource } from './activity.types';

export type ActivityChipColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error';

export function getAppLabel(app?: string): string {
  switch (app as ActivityAppSource | undefined) {
    case 'backend':
      return 'Backend';
    case 'web':
      return 'Web';
    case 'mobile':
      return 'Mobil';
    default:
      return app ?? '—';
  }
}

export function getLevelLabel(level?: string): string {
  const u = (level ?? '').toUpperCase();
  if (u === 'ERROR' || u === 'WARN' || u === 'INFO' || u === 'DEBUG') return u;
  return level ?? '—';
}

export function getLevelColor(level?: string): ActivityChipColor {
  const u = (level ?? '').toUpperCase();
  switch (u) {
    case 'ERROR':
      return 'error';
    case 'WARN':
      return 'warning';
    case 'INFO':
      return 'info';
    case 'DEBUG':
      return 'default';
    default:
      return 'default';
  }
}

export function getActivityEventColor(event?: string): ActivityChipColor {
  switch (event) {
    case 'EVENT_CREATED':
      return 'primary';
    case 'EVENT_SET_ACTIVE':
      return 'info';
    case 'PARTICIPANT_ADDED':
      return 'primary';
    case 'BARREL_ADDED':
      return 'info';
    case 'BEER_ADDED':
      return 'success';
    case 'USER_CREATED':
      return 'primary';
    case 'BEER_REMOVED':
      return 'error';
    case 'BEER_PONG_EVENT_CREATED':
      return 'secondary';
    case 'BEER_PONG_TEAM_CREATED':
      return 'secondary';
    case 'BEER_PONG_STARTED':
      return 'warning';
    case 'PARTICIPANT_REGISTERED':
      return 'info';
    case 'SYSTEM_OPERATION_TRIGGERED':
      return 'warning';
    case 'SETTINGS_CHANGED':
      return 'warning';
    case 'LOGIN_SUCCESS':
    case 'LOGIN':
    case 'LOGIN_2FA':
    case 'LOGIN_GOOGLE':
    case 'REGISTRATION_COMPLETED':
      return 'success';
    case 'LOGOUT':
      return 'default';
    case 'DATA_EXPORT':
    case 'EVENT_EXPORT_EXCEL':
      return 'info';
    case 'BEER_ADD_FAILED':
    case 'BEER_REMOVE_FAILED':
    case 'BARREL_CREATE_FAILED':
    case 'BARREL_UPDATE_FAILED':
    case 'BARREL_SET_ACTIVE_FAILED':
    case 'BARREL_DELETE_FAILED':
    case 'PROFILE_PICTURE_UPLOAD_FAILED':
    case 'EVENT_UPDATE_FAILED':
    case 'GALLERY_PHOTO_UPLOAD_FAILED':
    case 'GALLERY_PHOTO_DELETE_FAILED':
      return 'error';
    default:
      return 'default';
  }
}

export function getActivityEventLabel(event?: string): string {
  switch (event) {
    case 'EVENT_CREATED':
      return 'Vytvořena událost';
    case 'EVENT_SET_ACTIVE':
      return 'Aktivní událost';
    case 'PARTICIPANT_ADDED':
      return 'Přidán účastník';
    case 'BARREL_ADDED':
      return 'Přidán sud';
    case 'BEER_ADDED':
      return 'Přidáno pivo';
    case 'USER_CREATED':
      return 'Vytvořen uživatel';
    case 'BEER_REMOVED':
      return 'Odebráno pivo';
    case 'BEER_PONG_EVENT_CREATED':
      return 'Beer Pong vytvořen';
    case 'BEER_PONG_TEAM_CREATED':
      return 'BP tým vytvořen';
    case 'BEER_PONG_STARTED':
      return 'Beer Pong spuštěn';
    case 'PARTICIPANT_REGISTERED':
      return 'Registrace';
    case 'SYSTEM_OPERATION_TRIGGERED':
      return 'Systémová operace';
    case 'SETTINGS_CHANGED':
      return 'Nastavení';
    case 'LOGIN_SUCCESS':
    case 'LOGIN':
    case 'LOGIN_2FA':
    case 'LOGIN_GOOGLE':
      return 'Přihlášení';
    case 'LOGOUT':
      return 'Odhlášení';
    case 'REGISTRATION_COMPLETED':
      return 'Dokončená registrace';
    case 'DATA_EXPORT':
      return 'Export dat';
    case 'EVENT_EXPORT_EXCEL':
      return 'Export Excel';
    case 'BEER_ADD_FAILED':
      return 'Přidání piva selhalo';
    case 'BEER_REMOVE_FAILED':
      return 'Odebrání piva selhalo';
    case 'BARREL_CREATE_FAILED':
      return 'Vytvoření sudu selhalo';
    case 'BARREL_UPDATE_FAILED':
      return 'Úprava sudu selhala';
    case 'BARREL_SET_ACTIVE_FAILED':
      return 'Aktivace sudu selhala';
    case 'BARREL_DELETE_FAILED':
      return 'Smazání sudu selhalo';
    case 'PROFILE_PICTURE_UPLOAD_FAILED':
      return 'Nahrání fotky profilu selhalo';
    case 'EVENT_UPDATE_FAILED':
      return 'Úprava události selhala';
    case 'GALLERY_PHOTO_UPLOAD_FAILED':
      return 'Nahrání fotky do galerie selhalo';
    case 'GALLERY_PHOTO_DELETE_FAILED':
      return 'Smazání fotky z galerie selhalo';
    default:
      return event ?? '';
  }
}

export function getUserLabel(user?: Pick<ActivityUserRef, 'username' | 'name'>, fallbackId?: string) {
  return user?.username || user?.name || fallbackId || 'Neznámý';
}

function getStringField(log: ActivityLogEntry, key: string): string | undefined {
  const value = log[key];
  return typeof value === 'string' ? value : undefined;
}

export function getActivityEventMessage(log: ActivityLogEntry): string {
  const actor = log.actor ? getUserLabel(log.actor, log.actorUserId) : null;
  const targetUser = getUserLabel(log.user, log.userId);

  switch (log.event as ActivityEventType | undefined) {
    case 'EVENT_CREATED': {
      const eventName = log.eventName ?? getStringField(log, 'eventName');
      return `Vytvořena událost ${eventName ? `"${eventName}"` : ''}`.trim();
    }
    case 'EVENT_SET_ACTIVE':
      return 'Nastavena aktivní událost';
    case 'PARTICIPANT_ADDED':
      return `Přidán účastník ${targetUser}${actor ? ` (provedl ${actor})` : ''}`;
    case 'BARREL_ADDED':
      return `Přidán sud ${log.barrelId || ''}${actor ? ` (provedl ${actor})` : ''}`.trim();
    case 'BEER_ADDED':
      return `Přidáno pivo uživateli ${targetUser}${actor ? ` (provedl ${actor})` : ''}`;
    case 'USER_CREATED':
      return `Vytvořen nový uživatel: ${log.name || 'Neznámý'} (${log.gender || 'Neznámé pohlaví'})`;
    case 'BEER_REMOVED':
      return `Odebráno pivo uživateli ${targetUser}${actor ? ` (provedl ${actor})` : ''}`;
    case 'BEER_PONG_EVENT_CREATED': {
      const name = log.name ?? getStringField(log, 'name');
      return `Vytvořen Beer Pong turnaj${name ? ` "${name}"` : ''}${actor ? ` (provedl ${actor})` : ''}`;
    }
    case 'BEER_PONG_TEAM_CREATED': {
      const name = log.name ?? getStringField(log, 'name');
      return `Vytvořen BP tým${name ? ` "${name}"` : ''}${actor ? ` (provedl ${actor})` : ''}`;
    }
    case 'BEER_PONG_STARTED':
      return `Spuštěn Beer Pong turnaj${actor ? ` (provedl ${actor})` : ''}`;
    case 'PARTICIPANT_REGISTERED': {
      const username = getStringField(log, 'username');
      return `Dokončena registrace: ${username || targetUser}`;
    }
    case 'SYSTEM_OPERATION_TRIGGERED': {
      const op = log.operation ?? getStringField(log, 'operation');
      const jobId = getStringField(log, 'jobId');
      if (op === 'BACKUP_RUN' && jobId) {
        return `Spuštěna záloha (úloha: ${jobId})${actor ? ` — ${actor}` : ''}`;
      }
      return `Spuštěna systémová operace${op ? `: ${op}` : ''}${actor ? ` (provedl ${actor})` : ''}`;
    }
    case 'SETTINGS_CHANGED': {
      const setting = log.setting ?? getStringField(log, 'setting');
      const key = log.key ?? getStringField(log, 'key');
      const what = [setting, key].filter(Boolean).join(' ');
      return `Změna nastavení${what ? `: ${what}` : ''}${actor ? ` (provedl ${actor})` : ''}`;
    }
    case 'BEER_ADD_FAILED':
    case 'BEER_REMOVE_FAILED':
    case 'BARREL_CREATE_FAILED':
    case 'BARREL_UPDATE_FAILED':
    case 'BARREL_SET_ACTIVE_FAILED':
    case 'BARREL_DELETE_FAILED':
    case 'PROFILE_PICTURE_UPLOAD_FAILED':
    case 'EVENT_UPDATE_FAILED':
    case 'GALLERY_PHOTO_UPLOAD_FAILED':
    case 'GALLERY_PHOTO_DELETE_FAILED': {
      const reason = getStringField(log, 'reason');
      return reason ? `${log.message}: ${reason}` : log.message;
    }
    default:
      return log.message;
  }
}

