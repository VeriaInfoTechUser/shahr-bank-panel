# Risk Report — Sections Endpoint (Frontend Guide)

This document describes the **report sections** API for the risk module. It turns a risk report into a **dashboard of sections** — each section carries a ready-to-render description (AI agent text, static demo content today) plus **live computed data** from the risk dashboard.

Risk reports are **baseline-only** today (no comparative period analysis), so there is no `reportType=comparative` and no `comparison` payload.

Base URL: `/api/v1`

---

## 1. Endpoint

```
GET /api/v1/grc/risks/report/sections
```

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/grc/risks/report/sections` | JWT bearer | Get the full risk report as a list of ordered sections |

The response is wrapped in the standard API envelope:

```json
{
  "result": true,
  "data": { ... RiskReportSectionsResponseDto ... },
  "error": []
}
```

## 2. Request query parameters

All parameters are optional query strings.

| Field | Type | Default | Notes |
|---|---|---|---|
| `reportType` | `'baseline'` | `baseline` | Only `baseline` is valid for risk. |
| `updatedAtStart` | string `YYYY-MM-DD` | — | Include only risks updated on/after this date. |
| `updatedAtEnd` | string `YYYY-MM-DD` | — | Include only risks updated on/before this date. |

Example requests:

```
GET /api/v1/grc/risks/report/sections
GET /api/v1/grc/risks/report/sections?updatedAtStart=2026-01-01&updatedAtEnd=2026-12-31
```

## 3. Response model

```
data (RiskReportSectionsResponseDto)
├── reportType   string  ('baseline')
└── sections[]   RiskReportSectionDto
      ├── key          string   — stable section key
      ├── title        string   — Persian title
      ├── titleEn      string   — English title
      ├── order        number   — rendering order
      ├── reportType   string   — 'baseline'
      ├── description  string   — AI agent text (static demo for now)
      └── data?        RiskReportSectionDataDto | null — live dashboard data
```

`RiskReportSectionDataDto` — exactly **one** field is populated per section (all optional):

| Field | Type | Populated on |
|---|---|---|
| `summary` | `RiskDashboardSummary` | `executive-summary` |
| `frameworkOverview` | `FrameworkRiskItem[]` | `framework-overview` |
| `frameworkHeatmap` | `FrameworkHeatmapCell[]` | `framework-heatmap` |
| `frameworkHighRisk` | `FrameworkRankItem[]` | `high-risk-frameworks` |
| `frameworkLowRisk` | `FrameworkRankItem[]` | `low-risk-frameworks` |
| `topRisks` | `{ topAnalysis, topResponse, topMonitoring: RiskDashboardItem[] }` | `top-risks` |
| `riskByDomain` | `DomainRiskItem[]` | `risk-by-domain` |
| `ownerDistribution` | `OwnerRiskItem[]` | `owner-distribution` |
| `categoryDistribution` | `CategoryRiskItem[]` | `category-distribution` |
| `scoreDistribution` | `ScoreDistributionItem[]` | `score-distribution` |
| `riskMatrix` | `RiskMatrixCell[]` (5×5, 25 cells) | `risk-matrix` |
| `trendOverTime` | `{ date, threat, opportunity }[]` (last 90 days) | `trend-over-time` |
| `riskHeatmap` | `{ impact, likelihood, count, dominantLevel? }[]` | `risk-heatmap` |
| `recentActivity` | `RiskDashboardItem[]` | `recent-activity` |

## 4. Sections

| `order` | `key` | title (Fa) | titleEn | `data` payload |
|---|---|---|---|---|
| 1 | `executive-summary` | خلاصه مدیریتی | Executive Summary | `summary` |
| 2 | `framework-overview` | نمای چارچوبهای ریسک | Framework Overview | `frameworkOverview` |
| 3 | `framework-heatmap` | نقشه حرارتی چارچوب و سطح | Framework Heatmap | `frameworkHeatmap` |
| 4 | `high-risk-frameworks` | چارچوبهای پرریسک | High-Risk Frameworks | `frameworkHighRisk` |
| 5 | `low-risk-frameworks` | چارچوبهای کمریسک | Low-Risk Frameworks | `frameworkLowRisk` |
| 6 | `top-risks` | ریسکهای برتر در حال اقدام | Top Risks in Progress | `topRisks` |
| 7 | `risk-by-domain` | ریسکها به تفکیک حوزه | Risk by Domain | `riskByDomain` |
| 8 | `owner-distribution` | توزیع مالکان ریسک | Owner Distribution | `ownerDistribution` |
| 9 | `category-distribution` | توزیع دستهبندی ریسک | Category Distribution | `categoryDistribution` |
| 10 | `score-distribution` | توزیع نمرات ریسک | Score Distribution | `scoreDistribution` |
| 11 | `risk-matrix` | ماتریس ریسک | Risk Matrix | `riskMatrix` |
| 12 | `trend-over-time` | روند زمانی ریسکها | Trend Over Time | `trendOverTime` |
| 13 | `risk-heatmap` | نقشه حرارتی شدت ریسک | Risk Heatmap | `riskHeatmap` |
| 14 | `recent-activity` | فعالیتهای اخیر ریسک | Recent Activity | `recentActivity` |
| 15 | `outlook` | چشمانداز و اهداف آینده | Outlook & Targets | `null` (narrative only) |

Render `data.sections` in array order (already sorted by `order`). Use `key` as the stable anchor id. `data` may be `null` for `outlook` — render the description as a full-width text block. Titles and descriptions are Persian (RTL); `titleEn` is English.

> **Note:** when `updatedAtStart`/`updatedAtEnd` are sent, they filter every section **except** `trend-over-time` and `risk-heatmap`, which are computed globally across all risks (the trend is always the last 90 days). Treat those two sections as portfolio-wide context, not period-scoped.

**Suggested visuals** — summary: KPI cards + donut/bars for `byLevel`/`byState`/`byType`; risk matrix & heatmaps: colored grid; trend: line chart (`threat` vs `opportunity`); `topRisks`: three top-10 tables (analysis / response / monitoring).
