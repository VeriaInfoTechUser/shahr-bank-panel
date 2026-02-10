import { BaseRepo } from './baseRepo';
import { endpoints } from '../api/endpoints';

export interface UserListParams {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
  status?: unknown;
}

export interface UserProfile {
  id?: string;
  identity?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: unknown[];
  [key: string]: unknown;
}

export class UserRepo extends BaseRepo {
  async list(params: UserListParams) {
    return this.post(endpoints.admin.user.profile.list, params);
  }

  async getRoles() {
    return this.post(endpoints.admin.user.role.list);
  }

  async getProfile() {
    return this.post(endpoints.user.profile.view, {});
  }

  async getProfileHistory(params?: { page?: number; limit?: number }) {
    return this.post(endpoints.user.profile.history, params ?? {});
  }

  async updateProfile(payload: Record<string, unknown>) {
    return this.post(endpoints.user.profile.update, payload);
  }

  async updatePassword(payload: { current_password?: string; new_password?: string }) {
    return this.post(endpoints.user.password.update, payload);
  }

  async addPassword(payload: Record<string, unknown>) {
    return this.post(endpoints.user.password.add, payload);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.postFormData(endpoints.user.avatar.upload, formData);
  }

  async addUser(payload: Record<string, unknown>) {
    return this.post(endpoints.admin.user.profile.add, payload);
  }

  async editUser(payload: Record<string, unknown>) {
    return this.post(endpoints.admin.user.profile.edit, payload);
  }

  async updateUserPassword(payload: Record<string, unknown>) {
    return this.post(endpoints.admin.user.profile.password, payload);
  }

  async setStatus(userId: string, status: number) {
    return this.post(endpoints.admin.user.profile.status, { user_id: userId, status });
  }

  async deleteUser(userId: string) {
    return this.post(endpoints.admin.user.profile.delete, { user_id: userId });
  }
}

export const userRepo = new UserRepo();
