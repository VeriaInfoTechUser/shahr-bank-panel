import { BaseRepo } from './baseRepo';
import { endpoints } from '../api/endpoints';
import type { ApiResult } from './baseRepo';

export interface RuleListParams {
  page?: number;
  limit?: number;
  sort?: Record<string, number>;
  [key: string]: unknown;
}

export interface RuleListItem {
  id?: string;
  [key: string]: unknown;
}

export interface RuleListResponse {
  data?: {
    list?: RuleListItem[];
    paginator?: { count?: number };
  };
}

export class ErmRepo extends BaseRepo {
  async list(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.rule.list, params);
  }

  async addRule(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.rule.add, payload);
  }

  async editRule(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.rule.edit, payload);
  }

  async ruleCategoryList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.ruleCategory.list, params);
  }

  async taskList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.task.list, params);
  }

  async addTask(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.task.add, payload);
  }

  async editTask(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.task.edit, payload);
  }

  async memberList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.member.list, params);
  }

  async ruleAuthorList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.ruleAuthor.list, params);
  }

  async ruleTypeList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.ruleType.list, params);
  }

  async domainTree(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.domain.tree, params);
  }

  async warrantyList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.warranty.list, params);
  }

  async mandatoryUnitList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.mandatoryUnit.list, params);
  }

  async complianceList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.compliance.list, params);
  }

  async riskList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.risk.list, params);
  }
}

export const ermRepo = new ErmRepo();
