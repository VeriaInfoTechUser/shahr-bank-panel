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
  frameworkList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/frameworks', params });
  },

  frameworkGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/grc/frameworks/${slug}` });
  },

  frameworkCreate(data: GrcCreateFramework): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/grc/frameworks', data });
  },

  frameworkUpdate(slug: string, data: GrcUpdateFramework): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/grc/frameworks/${slug}`, data });
  },

  frameworkDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/grc/frameworks/${slug}` });
  },

  // Domains
  domainList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/domains', params });
  },

  domainGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/grc/domains/${slug}` });
  },

  domainCreate(data: GrcCreateDomain): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/grc/domains', data });
  },

  domainUpdate(slug: string, data: GrcUpdateDomain): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/grc/domains/${slug}`, data });
  },

  domainDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/grc/domains/${slug}` });
  },

  // Controls
  controlList(params?: GrcListParams): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/controls', params });
  },

  controlGet(slug: string): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'GET', url: `/grc/controls/${slug}` });
  },

  controlCreate(data: GrcCreateControl): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'POST', url: '/grc/controls', data });
  },

  controlUpdate(slug: string, data: GrcUpdateControl): Promise<GrcApiResponse<GrcEntity>> {
    return grcHttpRequest({ method: 'PUT', url: `/grc/controls/${slug}`, data });
  },

  controlDelete(slug: string): Promise<GrcApiResponse<null>> {
    return grcHttpRequest({ method: 'DELETE', url: `/grc/controls/${slug}` });
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
    return grcHttpRequest({ method: 'PUT', url: `/compliance/tasks/${slug}`, data });
  },

  // Risks
  riskList(params?: Record<string, unknown>): Promise<GrcApiResponse<GrcPaginatedResponse>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks', params });
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

  riskAction(slug: string, state: string, data?: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'POST', url: `/grc/risks/${slug}/${state}`, data: data ?? {} });
  },

  riskTasksUpdate(slug: string, tasks: Record<string, unknown>[]): Promise<GrcApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'PATCH', url: `/grc/risks/${slug}/tasks`, data: { tasks } });
  },

  riskCategoriesTree(): Promise<GrcApiResponse<Record<string, unknown>[]>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks/categories/tree' });
  },

  riskCategoriesList(params?: Record<string, unknown>): Promise<GrcApiResponse<Record<string, unknown>[]>> {
    return grcHttpRequest({ method: 'GET', url: '/grc/risks/categories/list', params });
  },
};
