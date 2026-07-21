import { grcHttpRequest } from '../api/grcHttp';

export interface GrcEntity {
  id: number;
  slug: string;
  type: string;
  source: string;
  status: number;
  state: string | null;
  parentSlug: string | null;
  tenantId: number | null;
  title: string | null;
  number: string | null;
  summary: string | null;
  version: string | null;
  description: string | null;
  controlCount: number | null;
  domainsCount: number | null;
  frameworkSlug: string | null;
  domainSlug: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrcPaginatedResponse {
  list: GrcEntity[];
  paginator: {
    count: number;
    limit: number;
    page: number;
  };
}

export interface GrcApiResponse<T> {
  result: boolean;
  data: T;
  error: string[];
}

export interface GrcListParams {
  page?: number;
  limit?: number;
  status?: number;
  title?: string;
  frameworkSlug?: string;
  domainSlug?: string;
  [key: string]: unknown;
}

export interface GrcCreateFramework {
  slug: string;
  status: number;
  state?: string;
  title?: string;
  number?: string;
  summary?: string;
  version?: string;
  description?: string;
  controlCount?: number;
  domainsCount?: number;
  createdBy?: number;
}

export interface GrcCreateDomain {
  slug: string;
  status: number;
  state?: string;
  parentSlug?: string;
  title?: string;
  number?: string;
  summary?: string;
  version?: string;
  description?: string;
  frameworkSlug?: string;
  controlCount?: number;
  createdBy?: number;
}

export interface GrcCreateControl {
  slug: string;
  status: number;
  state?: string;
  parentSlug?: string;
  title?: string;
  number?: string;
  summary?: string;
  version?: string;
  description?: string;
  frameworkSlug?: string;
  domainSlug?: string;
  createdBy?: number;
}

export type GrcUpdateFramework = Partial<GrcCreateFramework>;
export type GrcUpdateDomain = Partial<GrcCreateDomain>;
export type GrcUpdateControl = Partial<GrcCreateControl>;
export interface PlanTaskAssignment {
  controlSlug: string;
  controlTitle: string;
  controlSummary: string | null;
  frameworkSlug: string | null;
  frameworkTitle: string | null;
  domainSlug: string | null;
  domainTitle: string | null;
  assigneeId: string;
  deadline: string;
}

export interface GrcCreatePlan {
  title: string;
  deadline: string;
  ownerId: string;
  frameworkSlug: string | string[];
  frameworkTitle?: string | string[];
  domainSlug?: string | string[];
  domainTitle?: string | string[];
  tasks: PlanTaskAssignment[];
}

export type GrcUpdatePlan = Partial<GrcCreateFramework>;

export const grcRepo = {
  // Frameworks
  riskDashboard(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks/dashboard', params });
  },

  complianceDashboard(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/compliance/dashboard', params });
  },

  // Frameworks
  frameworkList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/frameworks', params });
  },

  frameworkGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/context/frameworks/${slug}` });
  },

  frameworkCreate(data: GrcCreateFramework): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/frameworks', data });
  },

  frameworkUpdate(slug: string, data: GrcUpdateFramework): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/frameworks/${slug}`, data });
  },

  frameworkDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/frameworks/${slug}` });
  },

  // Domains
  domainList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/domains', params });
  },

  domainGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/context/domains/${slug}` });
  },

  domainCreate(data: GrcCreateDomain): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/domains', data });
  },

  domainUpdate(slug: string, data: GrcUpdateDomain): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/domains/${slug}`, data });
  },

  domainDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/domains/${slug}` });
  },

  // Components
  componentList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/components', params });
  },

  componentCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/components', data });
  },

  componentUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/components/${slug}`, data });
  },

  componentDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/components/${slug}` });
  },

  // Capabilities
  capabilityList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/capabilities', params });
  },

  // Controls
  controlList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/controls', params });
  },

  controlGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/context/controls/${slug}` });
  },

  controlCreate(data: GrcCreateControl): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/controls', data });
  },

  controlUpdate(slug: string, data: GrcUpdateControl): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/controls/${slug}`, data });
  },

  controlDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/controls/${slug}` });
  },

  // Plans
  planList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/compliance/plans', params });
  },

  planGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/compliance/plans/${slug}` });
  },

  planCreate(data: GrcCreatePlan): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/compliance/plans', data });
  },

  planCreateWithControls(data: GrcCreatePlan): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/compliance/plans', data });
  },

  planUpdate(slug: string, data: GrcUpdatePlan): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/compliance/plans/${slug}`, data });
  },

  planDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/compliance/plans/${slug}` });
  },

  // Compliance Tasks
  complianceTaskList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/compliance/tasks', params });
  },

  complianceTaskUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PATCH', url: `/compliance/tasks/${slug}`, data });
  },

  // Risks
  riskList(params?: Record<string, unknown>): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks', params });
  },

  riskTaskList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks/tasks', params });
  },

  riskTaskUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PATCH', url: `/grc/risks/tasks/${slug}`, data });
  },

  riskGet(slug: string): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'GET', url: `/grc/risks/${slug}` });
  },

  riskCreate(data: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: '/grc/risks', data });
  },

  riskUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'PATCH', url: `/grc/risks/${slug}`, data });
  },

  riskDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/grc/risks/${slug}` });
  },

  riskAction(slug: string, state: string, data?: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/grc/risks/${slug}/${state}`, data: data ?? {} });
  },

  riskTasksUpdate(slug: string, tasks: Record<string, unknown>[]): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'PATCH', url: `/grc/risks/${slug}/tasks`, data: { tasks } });
  },

  riskTasksList(slug: string): Promise<GrcApiResponse<Record<string, unknown>[]>> {
    return grcHttpRequest({ method: 'GET', url: `/grc/risks/${slug}/tasks` });
  },

  riskCategoriesTree(): Promise<GrcApiResponse<Record<string, unknown>[]>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks/categories/tree' });
  },

  riskCategoriesList(params?: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>[]>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks/categories/list', params });
  },

  // Governance Categories
  governanceCategoriesTree(): Promise<GrcApiResponse<Record<string, unknown>[]>> {
    return grcHttpRequest({ method: 'GET', url: '/context/categories/tree' });
  },

  governanceCategoryCreate(data: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: '/context/categories', data });
  },

  governanceCategoryUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/categories/${slug}`, data });
  },

  governanceCategoryDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/categories/${slug}` });
  },

  // Capitals
  capitalList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/capitals', params });
  },

  capitalTree(params?: GrcListParams): Promise<GrcApiResponse<Record<string, unknown>[]>> {
    return grcHttpRequest({ method: 'GET', url: '/context/capitals/tree', params });
  },

  capitalCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/capitals', data });
  },

  capitalUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/capitals/${slug}`, data });
  },

  capitalDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/capitals/${slug}` });
  },

  // Claims
  claimList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/claims', params });
  },

  claimGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/context/claims/${slug}` });
  },

  claimCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/claims', data });
  },

  claimUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/claims/${slug}`, data });
  },

  claimDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/claims/${slug}` });
  },

  // Indicators
  indicatorList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/indicators', params });
  },

  indicatorGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/context/indicators/${slug}` });
  },

  indicatorCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/indicators', data });
  },

  indicatorUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/indicators/${slug}`, data });
  },

  indicatorDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/indicators/${slug}` });
  },

  // Types
  typeList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/governance/types', params });
  },

  typeGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/governance/types/${slug}` });
  },

  typeCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/governance/types', data });
  },

  typeUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/governance/types/${slug}`, data });
  },

  typeDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/governance/types/${slug}` });
  },

  // Legislators
  legislatorList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/governance/legislators', params });
  },

  legislatorGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/governance/legislators/${slug}` });
  },

  legislatorCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/governance/legislators', data });
  },

  legislatorUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/governance/legislators/${slug}`, data });
  },

  legislatorDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/governance/legislators/${slug}` });
  },

  // Generic Governance CRUD
  governanceList(type: string, params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/governance', params: { type, ...params } });
  },

  governanceGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/governance/${slug}` });
  },

  governanceCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/governance', data });
  },

  governanceUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/governance/${slug}`, data });
  },

  governanceDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/governance/${slug}` });
  },

  // Task Transitions
  taskStart(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/grc/tasks/${slug}/start`, data });
  },

  taskDone(slug: string, data: Record<string, unknown> = {}): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/grc/tasks/${slug}/done`, data });
  },

  taskApprove(slug: string, data: Record<string, unknown> = {}): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/grc/tasks/${slug}/approve`, data });
  },

  taskReject(slug: string, data: Record<string, unknown> = {}): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/grc/tasks/${slug}/reject`, data });
  },

  taskReopen(slug: string, data: Record<string, unknown> = {}): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/grc/tasks/${slug}/reopen`, data });
  },

  // Metrics
  metricsList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/context/metrics', params });
  },

  metricsGet(slug: string): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'GET', url: `/context/metrics/${slug}` });
  },

  metricsCreate(data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/context/metrics', data });
  },

  metricsUpdate(slug: string, data: Record<string, unknown>): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/context/metrics/${slug}`, data });
  },

  metricsDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/context/metrics/${slug}` });
  },

  // Metric Assets
  metricAssetsList(slug: string, params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/governance', params: { type: 'assets', metricSlug: slug, ...(params ?? {}) } });
  },

  // All Assets
  assetsList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/governance', params: { type: 'assets', ...(params ?? {}) } });
  },

  // Raw Data
  rawDataList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/raw-data', params });
  },

  // Calculations Jobs
  calculationJobList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/calculations/jobs', params });
  },

  // Calculations Primary
  calculationPrimaryList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/calculations/primary', params });
  },

  // Calculations Secondary
  calculationSecondaryList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/calculations/secondary', params });
  },

  calculationJobGet(id: string): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'GET', url: `/calculations/jobs/${id}` });
  },

  calculationJobCreate(data: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: '/calculations/jobs', data });
  },

  calculationJobUpdate(id: string, data: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'PUT', url: `/calculations/jobs/${id}`, data });
  },

  calculationJobDelete(id: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/calculations/jobs/${id}` });
  },

  calculationJobExecute(slug: string): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/calculations/jobs/${slug}/execute` });
  },

  // Calculations Logs
  calculationLogList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/calculations/logs', params });
  },
};
