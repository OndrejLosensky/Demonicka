export interface GetActivityLogsParams {
  page?: number;
  limit?: number;
  type?: string;
}

export interface GetActivityLogsResponse {
  data: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }>;
  total: number;
}

export const activityService = {
  async getActivityLogs(_params: GetActivityLogsParams = {}): Promise<GetActivityLogsResponse> {
    // TODO: Implement when backend API is available
    // For now, return empty data to prevent build errors
    return {
      data: [],
      total: 0,
    };
  },
};
