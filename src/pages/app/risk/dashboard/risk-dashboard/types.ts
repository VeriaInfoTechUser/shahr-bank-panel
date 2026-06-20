export type RiskLevel = "critical" | "high" | "medium" | "low"

export type RiskState =
  | "draft"
  | "registered"
  | "analysis"
  | "response"
  | "monitoring"
  | "closed"
  | "archived"

export type RiskType = "threat" | "opportunity"

export interface CountByState {
  state: RiskState
  count: number
}
export interface CountByLevel {
  level: RiskLevel
  count: number
}
export interface CountByType {
  riskType: RiskType
  count: number
}

export interface Summary {
  total: number
  byState: CountByState[]
  byLevel: CountByLevel[]
  byType: CountByType[]
}

export interface RiskItem {
  slug: string
  title: string
  riskType: RiskType
  level: RiskLevel | null
  score: number | null
  categoryTitle: string | null
  ownerId: string | null
  deadline: string | null
  frameworkTitle: string | null
  domainTitle: string | null
  updatedAt: string
}

export interface FrameworkOverview {
  frameworkSlug: string
  frameworkTitle: string
  totalRisks: number
  avgScore: number
  maxScore: number
  minScore: number
  byLevel: CountByLevel[]
  byState: CountByState[]
}

export interface FrameworkHeatmapCell {
  frameworkSlug: string
  frameworkTitle: string
  level: RiskLevel
  count: number
}

export interface FrameworkExtremeRisk {
  frameworkSlug: string
  frameworkTitle: string
  score: number
  riskTitle: string
  riskSlug: string
  level: RiskLevel
}

export interface DomainRisk {
  domainSlug: string
  domainTitle: string
  totalRisks: number
  byLevel: CountByLevel[]
}

export interface OwnerDistribution {
  ownerId: string
  totalRisks: number
  avgScore: number
  highRiskCount: number
}

export interface CategoryDistribution {
  categoryTitle: string
  totalRisks: number
  byLevel: CountByLevel[]
}

export interface ScoreRange {
  range: string
  count: number
}

export interface MatrixCell {
  impact: number
  likelihood: number
  count: number
}

export interface DashboardData {
  summary: Summary
  topAnalysis: RiskItem[]
  topResponse: RiskItem[]
  topMonitoring: RiskItem[]
  frameworkOverview: FrameworkOverview[]
  frameworkHeatmap: FrameworkHeatmapCell[]
  frameworkHighRisk: FrameworkExtremeRisk[]
  frameworkLowRisk: FrameworkExtremeRisk[]
  frameworkTopRisks: RiskItem[]
  riskByDomain: DomainRisk[]
  overdueRisks: RiskItem[]
  ownerDistribution: OwnerDistribution[]
  categoryDistribution: CategoryDistribution[]
  scoreDistribution: ScoreRange[]
  recentActivity: RiskItem[]
  riskMatrix: MatrixCell[]
}

/** پاسخ خام سرویس grcRepo.riskDashboard() */
export interface RiskDashboardResponse {
  result: boolean
  data: DashboardData
  error: string[]
}
