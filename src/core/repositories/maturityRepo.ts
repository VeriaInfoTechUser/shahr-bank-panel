import { grcHttpRequest } from '../api/grcHttp';

export interface MaturityApiResponse<T> {
  result: boolean;
  data: T;
  error: string[];
}

export interface MaturityListParams {
  page?: number;
  limit?: number;
  period_type?: string;
  date_from?: string;
  date_to?: string;
  capitalSlug?: string[];
  domainSlug?: string[];
  componentSlug?: string[];
  capabilitySlug?: string[];
  maturityLevel?: number[];
  targetLevel?: number[];
  minScore?: number;
  maxScore?: number;
  [key: string]: unknown;
}

/**
 * Maturity module — read-only, derived from the calculation module joined
 * with the sustainability referential tree. Base path: /api/v1/maturity.
 * See docs/maturity-module.md for the full API contract.
 */
export const maturityRepo = {
  dashboard(params?: Record<string, unknown>): Promise<MaturityApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'GET', url: '/maturity/dashboard', params });
  },

  list(params?: MaturityListParams): Promise<MaturityApiResponse<{ list: Record<string, unknown>[]; paginator: { count: number; limit: number; page: number } }>> {
    return grcHttpRequest({ method: 'GET', url: '/maturity', params });
  },

  capabilityDetail(slug: string, params?: Record<string, unknown>): Promise<MaturityApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'GET', url: `/maturity/capabilities/${slug}`, params });
  },

  compare(params?: Record<string, unknown>): Promise<MaturityApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'GET', url: '/maturity/compare', params });
  },

  report(type: string, params?: Record<string, unknown>): Promise<MaturityApiResponse<Record<string, unknown>>> {
    return grcHttpRequest({ method: 'GET', url: `/maturity/reports/${type}`, params });
  },
};
