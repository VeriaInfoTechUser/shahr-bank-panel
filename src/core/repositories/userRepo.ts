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

export interface EsgChartConfig {
  echarts_config?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface EsgDashboardControl {
  id?: number | string;
  slug?: string;
  metric_code?: string;
  kpi_code?: string;
  title?: string;
  summary?: string;
  i18n_key?: string;
  answer?: string | number | boolean | null;
  answer_unit?: string | null;
  answer_type?: string | null;
  unit_i18n?: string;
  dashboard_usage?: boolean;
  [key: string]: unknown;
}

export interface EsgDashboardDomain {
  id?: number | string;
  slug?: string;
  code?: string;
  title?: string;
  i18n_key?: string;
  stats?: {
    total_count?: number;
    answered_count?: number;
    unanswered_count?: number;
    completion_pct?: number;
    completion_score?: number;
    [key: string]: unknown;
  };
  chart?: EsgChartConfig;
  controls?: EsgDashboardControl[];
  [key: string]: unknown;
}

export interface EsgDashboardPillar {
  key: 'environmental' | 'social' | 'governance' | string;
  i18n_key?: string;
  color_hex?: string;
  color_theme?: string;
  icon?: string;
  order?: number;
  stats?: {
    domain_count?: number;
    total_controls?: number;
    answered_controls?: number;
    completion_score?: number;
    completion_pct?: number;
    [key: string]: unknown;
  };
  radar_chart?: EsgChartConfig;
  domains?: EsgDashboardDomain[];
  [key: string]: unknown;
}

export interface EsgDashboardSection {
  summary?: {
    total_kpis?: number;
    answered?: number;
    unanswered?: number;
    completion?: number;
    avg_score?: number;
    [key: string]: unknown;
  };
  domains?: unknown[];
  [key: string]: unknown;
}

export interface EsgDashboardPayload {
  last_updated?: string;
  reporting_period?: string;
  total_kpis?: number;
  governance?: EsgDashboardSection;
  social?: EsgDashboardSection;
  environmental?: EsgDashboardSection;
  [key: string]: unknown;
}

export interface EsgDashboardResponse {
  result: boolean;
  data: EsgDashboardPayload;
  error?: unknown[];
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

  async getEsgDashboard(): Promise<EsgDashboardResponse> {
    return this.post<EsgDashboardResponse>(endpoints.admin.esg.dashboard.get, {});
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
