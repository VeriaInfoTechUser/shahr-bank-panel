import { BaseRepo } from './baseRepo';
import { endpoints } from '../api/endpoints';

export class NotificationRepo extends BaseRepo {
  async getCount() {
    return this.post(endpoints.notification.count, {});
  }

  async getList(params?: { page?: number; limit?: number }) {
    return this.post(endpoints.notification.list, params ?? {});
  }
}

export const notificationRepo = new NotificationRepo();
