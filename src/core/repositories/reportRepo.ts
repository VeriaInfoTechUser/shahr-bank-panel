import { grcHttpRequest } from '../api/grcHttp';

export interface ReportItem {
  id: string;
  slug: string;
  type: string;
  source: string;
  status: number;
  title: string;
  reportType: string;
  frameworkSlug: string;
  frameworkTitle: string;
  dateType: string;
  periodType: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export class ReportRepo {
  private base = '/reports/sustainability';

  async getBaselineList(params?: Record<string, unknown>) {
    return grcHttpRequest<{ result: boolean; data: { list: ReportItem[]; paginator: { count: number } } }>({
      method: 'GET',
      url: `${this.base}/baseline`,
      params,
    });
  }

  async getComparativeList(params?: Record<string, unknown>) {
    return grcHttpRequest<{ result: boolean; data: { list: ReportItem[]; paginator: { count: number } } }>({
      method: 'GET',
      url: `${this.base}/comparative`,
      params,
    });
  }

  async createBaseline(payload: {
    title: string;
    type: string;
    frameworkSlug: string;
    frameworkTitle: string;
    dateType: string;
    periodType: string;
    startDate: string;
    endDate: string;
  }) {
    return grcHttpRequest({
      method: 'POST',
      url: `${this.base}/baseline`,
      data: payload,
    });
  }

  async createComparative(payload: {
    title: string;
    type: string;
    frameworkSlug: string;
    frameworkTitle: string;
    dateType: string;
    periodType: string;
    startDate: string;
    endDate: string;
  }) {
    return grcHttpRequest({
      method: 'POST',
      url: `${this.base}/comparative`,
      data: payload,
    });
  }

  async updateBaseline(slug: string, payload: { title: string }) {
    return grcHttpRequest({
      method: 'PUT',
      url: `${this.base}/baseline/${slug}`,
      data: payload,
    });
  }

  async updateComparative(slug: string, payload: { title: string }) {
    return grcHttpRequest({
      method: 'PUT',
      url: `${this.base}/comparative/${slug}`,
      data: payload,
    });
  }

  async downloadBaseline(reportId: string): Promise<Blob> {
    const response = await grcHttpRequest<Blob>({
      method: 'GET',
      url: `${this.base}/baseline/${reportId}/download`,
      responseType: 'blob',
    });
    return response;
  }

  async downloadComparative(reportId: string): Promise<Blob> {
    const response = await grcHttpRequest<Blob>({
      method: 'GET',
      url: `${this.base}/comparative/${reportId}/download`,
      responseType: 'blob',
    });
    return response;
  }
}

export const reportRepo = new ReportRepo();
