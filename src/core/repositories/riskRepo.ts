import { BaseRepo } from './baseRepo';

export class RiskRepo extends BaseRepo {
  async getRiskMetrics(params?: Record<string, unknown>) {
    return this.post('admin/risk/metrics', params ?? {});
  }

  async getRiskReport(params?: Record<string, unknown>) {
    return this.post('admin/risk/report', params ?? {});
  }
}

export const riskRepo = new RiskRepo();
