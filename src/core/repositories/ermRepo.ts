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

  /** payload: `{ id: taskId }` */
  async taskGet(payload: { id: number }) {
    return this.post<unknown>(endpoints.admin.erm.task.get, payload);
  }

  async memberList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.member.list, params);
  }

  /** جزئیات رابط شامل `user_log` و `user_inventory` — payload: `{ user_id }` */
  async memberView(payload: { user_id: number }) {
    return this.post<ApiResult<Record<string, unknown>>>(
      endpoints.admin.erm.member.view,
      payload
    );
  }

  async ruleAuthorList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.ruleAuthor.list, params);
  }

  async ruleAuthorAdd(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.ruleAuthor.add, payload);
  }

  async ruleAuthorEdit(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.ruleAuthor.edit, payload);
  }

  async ruleAuthorDelete(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.ruleAuthor.delete, payload);
  }

  async ruleTypeList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.ruleType.list, params);
  }

  async ruleTypeAdd(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.ruleType.add, payload);
  }

  async ruleTypeEdit(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.ruleType.edit, payload);
  }

  async ruleTypeDelete(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.ruleType.delete, payload);
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

  async complianceProgress(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.compliance.progress, payload);
  }

  /** payload: `{ task_id, progress_id }` */
  async complianceProgressDetail(payload: {
    task_id: number;
    progress_id: number;
  }) {
    return this.post<unknown>(endpoints.admin.erm.compliance.progressDetail, payload);
  }

  async riskList(params: RuleListParams) {
    return this.post<RuleListResponse>(endpoints.admin.erm.risk.list, params);
  }

  async riskProgress(payload: Record<string, unknown>) {
    return this.post<ApiResult<unknown>>(endpoints.admin.erm.risk.progress, payload);
  }

  /** payload: `{ task_id, progress_id }` — همان قرارداد compliance progress/detail */
  async riskProgressDetail(payload: {
    task_id: number;
    progress_id: number;
  }) {
    return this.post<unknown>(endpoints.admin.erm.risk.progressDetail, payload);
  }

  async riskResponseTypeList(params: RuleListParams = {}) {
    return this.post<RuleListResponse>(endpoints.admin.erm.risk.responseType, params);
  }
}

export const ermRepo = new ErmRepo();
