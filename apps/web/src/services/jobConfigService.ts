import { api } from './api';

const BACKUP_ENABLED_KEY = 'backup.enabled';
const BACKUP_INTERVAL_HOURS_KEY = 'backup.intervalHours';

export interface JobConfigResponse {
  [BACKUP_ENABLED_KEY]: boolean;
  [BACKUP_INTERVAL_HOURS_KEY]: number;
}

export const jobConfigService = {
  get(): Promise<JobConfigResponse> {
    return api.get<JobConfigResponse>('/system/job-config').then((r) => r.data);
  },

  patch(data: Partial<JobConfigResponse>): Promise<JobConfigResponse> {
    return api.patch<JobConfigResponse>('/system/job-config', data).then((r) => r.data);
  },
};
