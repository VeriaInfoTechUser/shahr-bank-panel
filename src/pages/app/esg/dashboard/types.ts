export type DashboardSectionType =
  | 'score_cards'
  | 'pie_chart'
  | 'line_chart'
  | 'progress_bars'
  | 'metric_grid'
  | 'data_table'
  | 'stat_cards'
  | 'activity_feed';

export type DashboardChartType = 'pie' | 'line' | 'gauge';

export type MetricStatus = 'good' | 'warning' | 'danger' | 'strong' | 'muted';

export interface DashboardResponse {
  success?: boolean;
  section: string;
  reportingPeriod?: string;
  lastUpdated?: string;
  summary: {
    overallGovernanceScore: number;
    scoreChange: string;
    dataCompleteness: number;
  };
  sections: DashboardSection[];
}

export interface DashboardSection {
  id: string;
  type: DashboardSectionType;
  title?: string;
  chartType?: DashboardChartType;
  cards?: ScoreCard[];
  data?: ChartDatum[];
  items?: Array<MetricItem | ProgressItem | StatItem | ActivityItem | DomainItem>;
  columns?: string[];
  rows?: TableRow[];
}

export interface ScoreCard {
  title: string;
  value: number;
  unit: string;
  change: string;
  chartType?: DashboardChartType | string;
}

export interface ChartDatum {
  label?: string;
  name?: string;
  year?: string;
  value: number | null;
  color?: string;
  [key: string]: unknown;
}

export interface MetricItem {
  metricCode?: string;
  title: string;
  value: number | null;
  unit: string;
  change?: string;
  status?: MetricStatus;
  answerType?: string;
  answerUnit?: string;
  domain?: string;
  type?: string;
}

export interface DomainMetric {
  title: string;
  value: number | null;
  unit: string;
  type?: string;
}

export interface DomainItem {
  label: string;
  value: number | null;
  secondaryValue?: number | null;
  unit?: string;
  status?: MetricStatus;
  keyMetrics?: DomainMetric[];
}

export interface ProgressItem {
  label?: string;
  title?: string;
  value: number | null;
  secondaryValue?: number | null;
  unit?: string;
  status?: MetricStatus;
  keyMetrics?: DomainMetric[];
}

export interface StatItem {
  title: string;
  value: number | string | null;
  unit?: string;
  label?: string;
  status?: MetricStatus | string;
  description?: string;
  change?: string;
}

export interface ActivityItem {
  title?: string;
  description?: string;
  user?: string;
  actor?: string;
  date?: string;
  time?: string;
  status?: MetricStatus | string;
  type?: string;
  [key: string]: unknown;
}

export type TableCell = string | number | boolean | null | undefined;

export type TableRow = Record<string, TableCell> | TableCell[];

export interface DashboardApiEnvelope {
  result?: boolean;
  success?: boolean;
  data?: DashboardResponse | Record<string, DashboardResponse>;
  error?: unknown;
}
