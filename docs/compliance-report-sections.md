# Compliance Report — Sections Endpoint (Frontend Guide)

This document describes the **report sections** API for the compliance module. It turns a compliance report into a **dashboard of sections** — each section carries a ready-to-render description (AI agent text, static demo content today) plus **live computed data** from the compliance summary dashboard.

Compliance reports are **baseline-only** today (no comparative period analysis), so there is no `reportType=comparative` and no `comparison` payload.

Base URL: `/api/v1`

---

## 1. Endpoint

```
GET /api/v1/compliance/report/sections
```

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/compliance/report/sections` | JWT bearer | Get the full compliance report as a list of ordered sections |

The response is wrapped in the standard API envelope:

```json
{
  "result": true,
  "data": { ... ComplianceReportSectionsResponseDto ... },
  "error": []
}
```

## 2. Request query parameters

All parameters are optional query strings.

| Field | Type | Default | Notes |
|---|---|---|---|
| `reportType` | `'baseline'` | `baseline` | Only `baseline` is valid for compliance. |
| `planSlug` | string (comma-separated) | — | Restrict the report to specific plan(s) (same filter as the compliance dashboard). |

Example requests:

```
GET /api/v1/compliance/report/sections
GET /api/v1/compliance/report/sections?planSlug=plan-a,plan-b
```

## 3. Response model

```
data (ComplianceReportSectionsResponseDto)
├── reportType   string  ('baseline')
└── sections[]   ComplianceReportSectionDto
      ├── key          string   — stable section key
      ├── title        string   — Persian title
      ├── titleEn      string   — English title
      ├── order        number   — rendering order
      ├── reportType   string   — 'baseline'
      ├── description  string   — AI agent text (static demo for now)
      └── data?        ComplianceReportSectionDataDto | null — live dashboard data
```

`ComplianceReportSectionDataDto` — exactly **one** field is populated per section (all optional):

| Field | Type | Populated on |
|---|---|---|
| `summary` | `ComplianceDashboardSummary` | `executive-summary` |
| `planOverview` | `PlanDashboardItem[]` | `plan-performance` |
| `frameworkCompliance` | `FrameworkComplianceItem[]` | `framework-compliance` |
| `domainCompliance` | `DomainComplianceItem[]` | `domain-compliance` |
| `controlCompliance` | `ControlComplianceItem[]` | `control-compliance` |
| `assigneePerformance` | `AssigneePerformanceItem[]` | `assignee-performance` |
| `ownerOverview` | `OwnerComplianceItem[]` | `owner-overview` |
| `answerDistribution` | `ComplianceSummaryByAnswer[]` | `answer-distribution` |
| `scoreDistribution` | `AnswerScoreDistributionItem[]` | `score-distribution` |
| `stateFunnel` | `ComplianceSummaryByState[]` | `state-funnel` |
| `overdueTasks` | `ComplianceDashboardItem[]` | `overdue-tasks` |
| `recentActivity` | `ComplianceDashboardItem[]` | `recent-activity` |

## 4. Sections

| `order` | `key` | title (Fa) | titleEn | `data` payload |
|---|---|---|---|---|
| 1 | `executive-summary` | خلاصه مدیریتی | Executive Summary | `summary` |
| 2 | `plan-performance` | عملکرد برنامههای انطباق | Plan Performance | `planOverview` |
| 3 | `framework-compliance` | انطباق چارچوبهای مرجع | Framework Compliance | `frameworkCompliance` |
| 4 | `domain-compliance` | انطباق حوزههای کنترلی | Domain Compliance | `domainCompliance` |
| 5 | `control-compliance` | انطباق کنترلهای کلیدی | Control Compliance | `controlCompliance` |
| 6 | `assignee-performance` | عملکرد مجریان وظایف | Assignee Performance | `assigneePerformance` |
| 7 | `owner-overview` | نمای مالکان برنامهها | Owner Overview | `ownerOverview` |
| 8 | `answer-distribution` | توزیع پاسخهای ارزیابی | Answer Distribution | `answerDistribution` |
| 9 | `score-distribution` | توزیع نمرات انطباق | Score Distribution | `scoreDistribution` |
| 10 | `state-funnel` | قیف وضعیت وظایف | Task State Funnel | `stateFunnel` |
| 11 | `overdue-tasks` | وظایف عقبافتاده | Overdue Tasks | `overdueTasks` |
| 12 | `recent-activity` | فعالیتهای اخیر | Recent Activity | `recentActivity` |
| 13 | `outlook` | چشمانداز و اهداف آینده | Outlook & Targets | `null` (narrative only) |

Render `data.sections` in array order (already sorted by `order`). Use `key` as the stable anchor id. `data` may be `null` for `outlook` — render the description as a full-width text block. Titles and descriptions are Persian (RTL); `titleEn` is English.
