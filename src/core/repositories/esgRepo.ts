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

export class ESGRepo extends BaseRepo {
  async list(params: ESGListParams) {
    return this.post<ESGListResponse>(endpoints.admin.esg.governance.list, params);
  }
}


export const esgRepo = new ESGRepo();
