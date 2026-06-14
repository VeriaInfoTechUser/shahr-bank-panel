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
};
