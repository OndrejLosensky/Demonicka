import { api } from './api';

export interface SystemOperationResponse {
  jobId: string;
  status: 'queued';
}

export const systemOperationsService = {
  cleanupSystem: () =>
    api.post<SystemOperationResponse>('/system/operations/cleanup-system', {}).then((r) => r.data),
  cleanupActiveEvent: () =>
    api.post<SystemOperationResponse>('/system/operations/cleanup-active-event', {}).then((r) => r.data),
  clearAllLogs: () =>
    api.post<SystemOperationResponse>('/system/operations/clear-all-logs', {}).then((r) => r.data),
};
