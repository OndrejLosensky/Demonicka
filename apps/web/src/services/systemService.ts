import { api } from './api';

export interface SystemUser {
  id: string;
  username: string;
  role: string;
  isRegistrationComplete: boolean;
  isTwoFactorEnabled: boolean;
  canLogin: boolean;
  lastAdminLogin: string | null; // Changed from Date to string since API returns ISO string
}

export interface SystemStats {
  users: SystemUser[];
  totalUsers: number;
  totalOperatorUsers: number;
  totalCompletedRegistrations: number;
  total2FAEnabled: number;
}

export const systemService = {
  async getSystemStats(): Promise<SystemStats> {
    try {
      const response = await api.get('/dashboard/system');
      return response.data;
    } catch (error) {
      console.error('Error fetching system stats:', error);
      throw error;
    }
  },

  async downloadSystemExcel(): Promise<{ blob: Blob; filename: string | null }> {
    const response = await api.get('/system/export/excel', {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    const contentDisposition = response.headers?.['content-disposition'];
    const filename = parseContentDispositionFilename(contentDisposition);
    return { blob: response.data as Blob, filename };
  },

  async downloadUsersExcel(): Promise<{ blob: Blob; filename: string | null }> {
    const response = await api.get('/system/export/excel/users', {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
    const contentDisposition = response.headers?.['content-disposition'];
    const filename = parseContentDispositionFilename(contentDisposition);
    return { blob: response.data as Blob, filename };
  },
};

function parseContentDispositionFilename(contentDisposition: string | undefined): string | null {
  if (!contentDisposition) return null;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1].trim());
    } catch {
      // ignore malformed
    }
  }
  const asciiMatch = contentDisposition.match(/filename="([^"]*)"/);
  if (asciiMatch) return asciiMatch[1].trim() || null;
  return null;
} 