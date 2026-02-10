import { BaseRepo } from './baseRepo';

export class ReportRepo extends BaseRepo {
  async getReportList(params?: Record<string, unknown>) {
    return this.post('admin/report/list', params ?? {});
  }

  async downloadReport(reportId: string): Promise<Blob> {
    return this.client.download(`admin/report/${reportId}/download`);
  }
}

export const reportRepo = new ReportRepo();
