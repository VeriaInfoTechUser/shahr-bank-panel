import { grcHttpRequest } from '../api/grcHttp';

export interface ReportItem {
  id: string;
  title: string;
  type: string;
  frameworkSlug: string;
  frameworkTitle?: string;
  dateType?: string;
  periodType: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
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
