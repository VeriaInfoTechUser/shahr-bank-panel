/** پاسخ‌های ممکن برای وضعیت انطباق هر وظیفه */
export type ComplianceAnswer = "not_started" | "compliant" | "partially_compliant" | "non_compliant"

/** وضعیت چرخه‌ی کاری هر وظیفه */
export type TaskState = "todo" | "in_progress" | "done" | "approved" | "rejected"

export interface CountByState {
  state: TaskState
  count: number
}

export interface CountByAnswer {
  answer: ComplianceAnswer
  count: number
  percentage: number
}

export interface Summary {
  totalPlans: number
  totalTasks: number
  overallScore: number
  completionRate: number
  tasksByState: CountByState[]
  tasksByAnswer: CountByAnswer[]
}

export interface PlanItem {
  planSlug: string
  title: string
  totalTasks: number
  approvedTasks: number
  rejectedTasks: number
  doneTasks: number
  inProgressTasks: number
  todoTasks: number
  completionRate: number
  avgScore: number
  deadline: string | null
  ownerId?: string | null
  updatedAt: string
}

export interface FrameworkCompliance {
  frameworkSlug: string
  frameworkTitle: string
  totalTasks: number
  avgScore: number
  complianceRate: number
  byAnswer: CountByAnswer[]
}

export interface FrameworkHeatmapCell {
  frameworkSlug: string
  frameworkTitle: string
  answer: ComplianceAnswer
  count: number
}

export interface DomainCompliance {
  domainSlug: string
  domainTitle: string
  totalTasks: number
  avgScore: number
  complianceRate: number
  byAnswer: CountByAnswer[]
}

export interface TaskItem {
  slug: string
  title: string
  controlTitle: string | null
  frameworkTitle: string | null
  domainTitle: string | null
  state: TaskState
  answer: ComplianceAnswer | null
  answerScore: number | null
  assigneeId: string | null
  ownerId?: string | null
  deadline: string | null
  planSlug: string
  updatedAt: string
}

export interface AssigneeDistribution {
  assigneeId: string
  totalTasks: number
  avgScore: number
  compliantCount: number
  nonCompliantCount: number
}

export interface OwnerDistribution {
  ownerId: string
  totalPlans: number
  totalTasks: number
  avgCompletionRate: number
}

export interface ScoreRange {
  range: string
  count: number
}

export interface DashboardData {
  summary: Summary
  topPlans: PlanItem[]
  bottomPlans: PlanItem[]
  frameworkCompliance: FrameworkCompliance[]
  frameworkHeatmap: FrameworkHeatmapCell[]
  domainCompliance: DomainCompliance[]
  overdueTasks: TaskItem[]
  assigneeDistribution: AssigneeDistribution[]
  ownerDistribution: OwnerDistribution[]
  scoreDistribution: ScoreRange[]
  recentActivity: TaskItem[]
}

/** پاسخ خام سرویس grcRepo.complianceDashboard() */
export interface ComplianceDashboardResponse {
  result: boolean
  data: DashboardData
  error: string[]
}
