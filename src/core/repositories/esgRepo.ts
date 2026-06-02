import { BaseRepo } from './baseRepo';
import { endpoints } from '../api/endpoints';
import type { ApiResult } from './baseRepo';

export interface ESGListParams {
  page?: number;
  limit?: number;
  sort?: Record<string, number>;
  [key: string]: unknown;
}

export interface ESGListItem {
  id?: string;
  [key: string]: unknown;
}

export interface ESGListResponse {
  data?: {
    list?: ESGListItem[];
    paginator?: { count?: number };
  };
}

export interface ESGUpdateParams {
  id?: number;
  slug?: string;
  answer?: string | number | null;
  [key: string]: unknown;
}

export class ESGRepo extends BaseRepo {
  async list(params: ESGListParams) {
    return this.post<ESGListResponse>(endpoints.admin.esg.governance.list, params);
  }

  async dashboard(params: ESGListParams = {}) {
    return this.post<unknown>(endpoints.admin.esg.dashboard.get, params);
  }

  async updateControl(payload: ESGUpdateParams) {
    return this.post<ApiResult<unknown>>(endpoints.admin.esg.governance.update, payload);
  }
}


export const esgRepo = new ESGRepo();
