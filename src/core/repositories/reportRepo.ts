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
  async getReportList(params?: Record<string, unknown>) {
    return grcHttpRequest<{ result: boolean; data: { list: ReportItem[]; paginator: { count: number } } }>({
      method: 'GET',
      url: '/reports/sustainability',
      params,
    });
  }

  async createReport(payload: {
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
      url: '/reports/sustainability',
      data: payload,
    });
  }

  async updateReport(slug: string, payload: { title: string }) {
    return grcHttpRequest({
      method: 'PUT',
      url: `/reports/sustainability/${slug}`,
      data: payload,
    });
  }

  async downloadReport(reportId: string): Promise<Blob> {
    const response = await grcHttpRequest<Blob>({
      method: 'GET',
      url: `/reports/sustainability/${reportId}/download`,
      responseType: 'blob',
    });
    return response;
  }
}

export const reportRepo = new ReportRepo();
