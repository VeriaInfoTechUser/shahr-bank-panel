/**
 * ESG Dashboard Data Types & Interfaces
 * Comprehensive TypeScript definitions for governance, social, and environmental data
 */

/**
 * Individual KPI (Key Performance Indicator)
 */
export interface ESGKpi {
  code: string;
  title: string;
  value: number | string;
  unit: 'percent' | 'count' | 'currency' | 'person' | string;
  type?: 'percentage' | 'number' | 'currency' | 'person';
  status: 'answered' | 'unanswered';
  domain?: string;
  frameworks?: string[];
}

/**
 * Domain grouping KPIs (e.g., Corporate Governance, Risk Management)
 */
export interface ESGDomain {
  code: string;
  title: string;
  slug: string;
  order: number;
  kpi_count: number;
  answered: number;
  avg_score: number;
  kpis: ESGKpi[];
}

/**
 * Summary statistics for a section
 */
export interface ESGSummary {
  total_kpis: number;
  answered: number;
  unanswered: number;
  completion: number; // percentage
  avg_score: number; // percentage
}

/**
 * Framework coverage (e.g., GRI Standards, ISSB)
 */
export interface FrameworkCoverage {
  name: string;
  count: number;
}

/**
 * Radar chart data for domain scores
 */
export interface RadarChartData {
  name: string;
  value: number[];
}

/**
 * Domain bar chart data (horizontal bar)
 */
export interface DomainBarData {
  domain: string;
  value: number;
  domainCode?: string;
}

/**
 * Answer type distribution (percentage, count, currency, person)
 */
export interface AnswerTypeData {
  type: string;
  count: number;
}

/**
 * Complete chart data set for a section
 */
export interface ESGChartsData {
  radar_data: {
    categories: string[];
    data: RadarChartData[];
  };
  domain_bar_percent: DomainBarData[];
  domain_bar_count: DomainBarData[];
  answer_type_distribution?: AnswerTypeData[];
  answer_status?: {
    answered: number;
    unanswered: number;
  };
}

/**
 * Detailed sections breakdown (used for domain detail cards at bottom)
 */
export interface DetailedSection {
  code: string;
  title: string;
  slug: string;
  order: number;
  kpi_count: number;
  answered: number;
  avg_score: number;
  kpis: ESGKpi[];
}

/**
 * Complete data for one ESG section (Governance, Social, or Environmental)
 */
export interface ESGSectionData {
  summary: ESGSummary;
  domains: ESGDomain[];
  all_kpis: ESGKpi[];
  framework_coverage: FrameworkCoverage[];
  charts: ESGChartsData;
  detailed_sections: DetailedSection[];
}

/**
 * Complete ESG Dashboard data from API
 */
export interface ESGDashboardData {
  governance: ESGSectionData;
  social: ESGSectionData;
  environmental: ESGSectionData;
  reporting_period?: string;
  last_updated?: string;
}

/**
 * Component Props
 */
export interface ESGDashboardProps {
  section: 'governance' | 'social' | 'environmental';
  dashboardData: ESGDashboardData;
  reportingPeriod?: string;
}

/**
 * Helper types for computed values
 */
export interface HeatmapCell {
  kpiCode: string;
  kpiTitle: string;
  domainCode: string;
  domainTitle: string;
  value: number | string;
  unit: string;
  status: 'answered' | 'unanswered';
  color: string; // CSS color for heatmap cell
}

export interface AnswerStatus {
  answered: number;
  unanswered: number;
  total: number;
}

export interface KpiSortable extends ESGKpi {
  domainCode?: string;
}
