import { BaseRepo } from './baseRepo';
import { endpoints } from '../api/endpoints';

export class DashboardRepo extends BaseRepo {
  async getUsersCount() {
    return this.post(endpoints.admin.user.profile.list, { page: 1, limit: 1 });
  }

  async getActivityLogs(params?: { page?: number; limit?: number }) {
    return this.post(endpoints.admin.logger.history.list, {
      page: params?.page ?? 1,
      limit: params?.limit ?? 5,
    });
  }
}

export const dashboardRepo = new DashboardRepo();
