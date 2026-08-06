# Sustainability Report — Sections Endpoint (Frontend Guide)

This document describes the **report sections** API for the frontend. It turns a sustainability report into a **dashboard of sections** — a professional report is broken into areas (executive summary, the six capitals, risk management, comparative analysis, outlook), and each section carries:

- a **description** (AI agent text — static demo content for now, will be AI-generated later), and
- **live computed data** from the sustainability dashboard (scores, maturity levels, capitals, risks, period comparison).

Base URL: `/api/v1`

---

## Table of Contents

- [1. Endpoint](#1-endpoint)
- [2. Request query parameters](#2-request-query-parameters)
- [3. Response model](#3-response-model)
- [4. Section types & data mapping](#4-section-types--data-mapping)
- [5. Reused dashboard DTOs](#5-reused-dashboard-dtos)
  - [5.1 `PeriodInfoDto`](#51-periodinfodto)
  - [5.2 `DashboardSummaryDto`](#52-dashboardsummarydto)
  - [5.3 `DashboardRiskDto`](#53-dashboardriskdto)
  - [5.4 `CapitalNodeDto` tree](#54-capitalnodedto-tree)
- [6. Full example response](#6-full-example-response)
- [7. Frontend integration notes](#7-frontend-integration-notes)

---

## 1. Endpoint

```
GET /api/v1/reports/sustainability/sections
```

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/reports/sustainability/sections` | JWT bearer | Get the full report as a list of ordered sections |

The response is wrapped in the standard API envelope:

```json
{
  "result": true,
  "data": { ... ReportSectionsResponseDto ... },
  "error": []
}
```

---

## 2. Request query parameters

All parameters are optional query strings.

| Field | Type | Default | Notes |
|---|---|---|---|
| `reportType` | `'baseline' \| 'comparative'` | `baseline` | Scopes which sections are returned (see Section 4). |
| `date_from` | string `YYYY-MM-DD` | latest completed period | Main period start |
| `date_to` | string `YYYY-MM-DD` | end of that period | Main period end |
| `period_type` | string | `YEARLY` | `YEARLY` \| `QUARTERLY` \| `MONTHLY` \| `WEEKLY` |
| `capital_slug` | string | — | Restrict the tree to one capital |
| `compare_period_type` | string | — | Must match `period_type` |
| `compare_date_from` | string | — | Required together with `compare_*` |
| `compare_date_to` | string | — | Required together with `compare_*` |

Example requests:

```
GET /api/v1/reports/sustainability/sections?reportType=baseline
GET /api/v1/reports/sustainability/sections?reportType=comparative&period_type=YEARLY
GET /api/v1/reports/sustainability/sections?reportType=comparative&compare_period_type=YEARLY&compare_date_from=2023-01-01&compare_date_to=2023-12-31
```

> If you send `compare_*` parameters you must send **all three** (`compare_period_type`, `compare_date_from`, `compare_date_to`), otherwise the API returns a 400 validation error.

---

## 3. Response model

```
data (ReportSectionsResponseDto)
├── reportType           string  ('baseline' | 'comparative')
├── period               PeriodInfoDto         — resolved main period
├── comparisonPeriod?    PeriodInfoDto | null  — set when compare_* sent
└── sections[]           ReportSectionDto
      ├── key            string   — stable section key
      ├── title          string   — Persian title
      ├── titleEn        string   — English title
      ├── order          number   — rendering order
      ├── reportType     string   — which report type owns this section
      ├── description    string   — AI agent text (static demo for now)
      └── data?          ReportSectionDataDto | null — live dashboard data
```

`ReportSectionDto` fields:

| Field | Type | Description |
|---|---|---|
| `key` | `string` | Stable identifier used by the frontend to render/route a section. |
| `title` | `string` | Persian section title (e.g. `سرمایه طبیعی`). |
| `titleEn` | `string` | English section title (e.g. `Natural Capital`). |
| `order` | `number` | Ordering within the report; render ascending. |
| `reportType` | `string` | `baseline` or `comparative`. |
| `description` | `string` | AI agent narrative for the section. **Demo/static content today** — render as-is. |
| `data` | `ReportSectionDataDto \| null` | Live computed data. `null` for purely narrative sections. |

`ReportSectionDataDto` — exactly **one** of these is populated per section, depending on the section type:

| Field | Type | Populated on |
|---|---|---|
| `summary` | `DashboardSummaryDto \| null` | `executive-summary` |
| `capital` | `CapitalNodeDto \| null` | each capital section |
| `risks` | `DashboardRiskDto \| null` | `risk-management` |
| `comparison` | `ReportSectionComparisonDto \| null` | `comparative-analysis` |

`ReportSectionComparisonDto`:

| Field | Type | Description |
|---|---|---|
| `period` | `PeriodInfoDto` | The comparison period metadata |
| `capitals` | `CapitalNodeDto[]` | Capital tree for the comparison period (nodes carry `comparison` values) |

---

## 4. Section types & data mapping

Sections are static definitions in the backend (`src/modules/report/data/sustainability-report-sections.ts`). The list below shows every section, its `key`, which `reportType` includes it, and what `data` it carries.

| `key` | title (Fa) | titleEn | `reportType` | `data` payload |
|---|---|---|---|---|
| `executive-summary` | خلاصه مدیریتی | Executive Summary | baseline + comparative | `summary` |
| `governance` | حاکمیت شرکتی و راهبرد | Governance & Strategy | baseline + comparative | `null` (narrative only) |
| `natural-capital` | سرمایه طبیعی | Natural Capital | baseline + comparative | `capital` (slug `CAP-NAT`) |
| `human-capital` | سرمایه انسانی | Human Capital | baseline + comparative | `capital` (slug `CAP-HUM`) |
| `social-capital` | سرمایه اجتماعی | Social Capital | baseline + comparative | `capital` (slug `CAP-SOC`) |
| `institutional-capital` | سرمایه نهادی | Institutional Capital | baseline + comparative | `capital` (slug `CAP-INS`) |
| `technological-capital` | سرمایه فناورانه | Technological Capital | baseline + comparative | `capital` (slug `CAP-TEC`) |
| `financial-capital` | سرمایه مالی و اقتصادی | Financial & Economic Capital | baseline + comparative | `capital` (slug `CAP-FEC`) |
| `risk-management` | مدیریت ریسک و فرصتها | Risk & Opportunity Management | baseline + comparative | `risks` |
| `comparative-analysis` | تحلیل مقایسهای دورهها | Comparative Analysis | **comparative only** | `comparison` |
| `outlook` | چشمانداز و اهداف آینده | Outlook & Targets | baseline + comparative | `null` (narrative only) |

**Section order** is the `order` field (1 → 11). Render the sections array as-is; it is already sorted.

Notes for the frontend:

- `reportType=baseline` → 10 sections (no `comparative-analysis`).
- `reportType=comparative` → 11 sections (includes `comparative-analysis`).
- A capital section with no stored data still exists, but its `data.capital` will be `null`-ish (score `null`, empty domains). Show the description + "no data" state.
- `data` may be **absent or `null`** for `governance` and `outlook` — these are narrative-only sections.
- `comparison` is only present (non-null) when a comparison period is active AND `reportType=comparative`; otherwise it is `null` or the field is omitted.

---

## 5. Reused dashboard DTOs

The section data reuses the existing sustainability dashboard DTOs. Details below.

### 5.1 `PeriodInfoDto`

```ts
{
  type: string,   // 'YEARLY' | 'QUARTERLY' | 'MONTHLY' | 'WEEKLY'
  year: number
}
```

### 5.2 `DashboardSummaryDto`

Present on `executive-summary.data.summary` (overview aggregates across all capitals).

| Field | Type | Description |
|---|---|---|
| `capitals` | number | Number of capitals |
| `domains` | number | Number of domains |
| `components` | number | Number of components |
| `capabilities` | number | Number of capabilities |
| `indicators` | number | Total indicators |
| `indicatorsWithData` | number | Indicators that have data in the period |
| `avgScore` | number | Average capital score (0–100) |
| `dataCompletion` | number | % of indicators with data (0–100) |
| `targetsTotal` | number | Capabilities with a required maturity target |
| `targetsMet` | number | Targets met |

### 5.3 `DashboardRiskDto`

Present on `risk-management.data.risks` (portfolio-wide risk overview, independent of `capital_slug`).

| Field | Type | Description |
|---|---|---|
| `total` | number | Total risks |
| `active` | number | Non-archived risks |
| `archived` | number | Archived risks |
| `byState` | `Record<string, number>` | Counts per risk state |
| `byLevel` | `Record<string, number>` | Counts per risk level |
| `byCapital` | `Record<string, number>` | Counts per capital slug |

### 5.4 `CapitalNodeDto` tree

Present as `data.capital` (capital sections) and inside `data.comparison.capitals` (comparative-analysis).

```
CapitalNodeDto
├── slug, title, titleEn, capitalType?
├── score          number|null   (0–100, null = no data)
├── maturity       { level, name, label, labelFa, min, max, color, emoji, status } | null
├── indicatorCount?        (overview mode)
├── indicatorsWithData?    (overview mode)
├── period         PeriodInfoDto
├── comparison?    { value: number|null, period: PeriodInfoDto } | null
└── domains[]  →  DomainNodeDto
      ├── slug, title, titleEn
      ├── score, maturity
      ├── period, comparison?
      └── components[]  →  ComponentNodeDto
            ├── slug, title, titleEn
            ├── score, maturity
            ├── period, comparison?
            └── capabilities[]  →  CapabilityNodeDto
                  ├── slug, title, titleEn
                  ├── score, maturity, requiredMaturity?, meetsTarget?
                  ├── indicatorCount?, indicatorsWithData?
                  ├── risks?  →  { summary: { total, byState, byLevel }, risks: RiskInfoDto[] }
                  ├── period, comparison?
                  └── indicators[]  (only on full-dashboard endpoint; empty on sections endpoint)
```

**Important:** the sections endpoint uses the **overview** shape — capabilities do **not** carry the full `indicators[]` list. `indicatorCount` / `indicatorsWithData` are the counts you should display.

Maturity level shape (from `maturity`):

```ts
{
  level: 1 | 2 | 3 | 4 | 5,
  name: 'INITIAL' | 'MANAGED' | 'DEFINED' | 'MEASURED' | 'OPTIMIZED',
  label: 'Initial',            // English label
  labelFa: 'اولیه',            // Persian label
  min: 0, max: 20,             // score range of this level
  color: '#EF4444',            // hex color
  emoji: '🔴',                 // emoji indicator
  status: 'red' | 'orange' | 'yellow' | 'green'
}
```

Level → color/status mapping:

| level | name | color | status |
|---|---|---|---|
| 1 | INITIAL | `#EF4444` | red |
| 2 | MANAGED | `#F97316` | orange |
| 3 | DEFINED | `#EAB308` | yellow |
| 4 | MEASURED | `#22C55E` | green |
| 5 | OPTIMIZED | `#16A34A` | green |

---

## 6. Full example response

Request:

```
GET /api/v1/reports/sustainability/sections?reportType=comparative&compare_period_type=YEARLY&compare_date_from=2023-01-01&compare_date_to=2023-12-31
```

Response (`data` trimmed):

```json
{
  "reportType": "comparative",
  "period": { "type": "YEARLY", "year": 2024 },
  "comparisonPeriod": { "type": "YEARLY", "year": 2023 },
  "sections": [
    {
      "key": "executive-summary",
      "title": "خلاصه مدیریتی",
      "titleEn": "Executive Summary",
      "order": 1,
      "reportType": "comparative",
      "description": "گزارش پایداری پیش‌رو تصویری یکپارچه از وضعیت سازمان در شش سرمایه اصلی ارائه می‌دهد. ...",
      "data": {
        "summary": {
          "capitals": 6,
          "domains": 12,
          "components": 30,
          "capabilities": 60,
          "indicators": 120,
          "indicatorsWithData": 95,
          "avgScore": 62.5,
          "dataCompletion": 79.2,
          "targetsTotal": 40,
          "targetsMet": 28
        }
      }
    },
    {
      "key": "governance",
      "title": "حاکمیت شرکتی و راهبرد",
      "titleEn": "Governance & Strategy",
      "order": 2,
      "reportType": "comparative",
      "description": "ساختار حاکمیت شرکتی سازمان بر مبنای شفافیت، پاسخگویی و نظارت مستمر طراحی شده است. ...",
      "data": null
    },
    {
      "key": "natural-capital",
      "title": "سرمایه طبیعی",
      "titleEn": "Natural Capital",
      "order": 3,
      "reportType": "comparative",
      "description": "سرمایه طبیعی شامل منابع زیست‌محیطی و آب‌وهوایی است که سازمان برای فعالیت‌های خود به آن‌ها وابسته است. ...",
      "data": {
        "capital": {
          "slug": "CAP-NAT",
          "title": "سرمایه طبیعی",
          "titleEn": "Natural Capital",
          "capitalType": "NAT",
          "score": 58.4,
          "maturity": {
            "level": 3,
            "name": "DEFINED",
            "label": "Defined",
            "labelFa": "تعریف‌شده",
            "min": 40,
            "max": 60,
            "color": "#EAB308",
            "emoji": "🟡",
            "status": "yellow"
          },
          "indicatorCount": 20,
          "indicatorsWithData": 16,
          "period": { "type": "YEARLY", "year": 2024 },
          "comparison": { "value": 54.1, "period": { "type": "YEARLY", "year": 2023 } },
          "domains": [
            {
              "slug": "DOM-NAT-XXX",
              "title": "مدیریت انرژی",
              "titleEn": "Energy Management",
              "score": 61.0,
              "maturity": { "level": 4, "name": "MEASURED", "label": "Measured", "labelFa": "سنجیده", "min": 60, "max": 80, "color": "#22C55E", "emoji": "🟢", "status": "green" },
              "period": { "type": "YEARLY", "year": 2024 },
              "comparison": { "value": 55.2, "period": { "type": "YEARLY", "year": 2023 } },
              "components": [
                {
                  "slug": "COMP-NAT-XXX",
                  "title": "کارایی انرژی",
                  "titleEn": "Energy Efficiency",
                  "score": 63.3,
                  "maturity": { "level": 4, "name": "MEASURED", "label": "Measured", "labelFa": "سنجیده", "min": 60, "max": 80, "color": "#22C55E", "emoji": "🟢", "status": "green" },
                  "period": { "type": "YEARLY", "year": 2024 },
                  "comparison": null,
                  "capabilities": [
                    {
                      "slug": "CAP-NAT-XXX",
                      "title": "پایش مصرف انرژی",
                      "titleEn": "Energy Consumption Monitoring",
                      "score": 66.7,
                      "maturity": { "level": 4, "name": "MEASURED", "label": "Measured", "labelFa": "سنجیده", "min": 60, "max": 80, "color": "#22C55E", "emoji": "🟢", "status": "green" },
                      "requiredMaturity": 4,
                      "meetsTarget": true,
                      "indicatorCount": 5,
                      "indicatorsWithData": 4,
                      "period": { "type": "YEARLY", "year": 2024 },
                      "comparison": { "value": 60.0, "period": { "type": "YEARLY", "year": 2023 } },
                      "risks": {
                        "summary": { "total": 2, "byState": { "monitoring": 2 }, "byLevel": { "medium": 2 } },
                        "risks": [
                          {
                            "slug": "RISK-XXX",
                            "title": "افزایش هزینه انرژی",
                            "state": "monitoring",
                            "level": "medium",
                            "score": 12,
                            "impact": 3,
                            "likelihood": 4,
                            "riskType": "threat",
                            "treatmentStrategy": "reduce",
                            "deadline": "2024-12-31",
                            "ownerId": "7"
                          }
                        ]
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    },
    {
      "key": "risk-management",
      "title": "مدیریت ریسک و فرصت‌ها",
      "titleEn": "Risk & Opportunity Management",
      "order": 9,
      "reportType": "comparative",
      "description": "سازمان ریسک‌ها و فرصت‌های مرتبط با موضوعات پایداری را به‌صورت نظام‌مند شناسایی، تحلیل و مدیریت می‌کند. ...",
      "data": {
        "risks": {
          "total": 25,
          "active": 22,
          "archived": 3,
          "byState": { "draft": 4, "analysis": 5, "monitoring": 13 },
          "byLevel": { "low": 9, "medium": 11, "high": 5 },
          "byCapital": { "CAP-NAT": 8, "CAP-HUM": 5, "CAP-FEC": 12 }
        }
      }
    },
    {
      "key": "comparative-analysis",
      "title": "تحلیل مقایسه‌ای دوره‌ها",
      "titleEn": "Comparative Analysis",
      "order": 10,
      "reportType": "comparative",
      "description": "این بخش عملکرد پایداری سازمان را در دو دوره گزارش‌گری به‌صورت مقایسه‌ای تحلیل می‌کند. ...",
      "data": {
        "comparison": {
          "period": { "type": "YEARLY", "year": 2023 },
          "capitals": [
            {
              "slug": "CAP-NAT",
              "title": "سرمایه طبیعی",
              "score": 54.1,
              "maturity": { "level": 3, "name": "DEFINED", "label": "Defined", "labelFa": "تعریف‌شده", "min": 40, "max": 60, "color": "#EAB308", "emoji": "🟡", "status": "yellow" },
              "domains": [],
              "period": { "type": "YEARLY", "year": 2023 }
            }
          ]
        }
      }
    },
    {
      "key": "outlook",
      "title": "چشم‌انداز و اهداف آینده",
      "titleEn": "Outlook & Targets",
      "order": 11,
      "reportType": "comparative",
      "description": "سازمان با تکیه بر نتایج ارزیابی دوره جاری، چارچوب اهداف آتی خود را در قالب ارتقای سطح بلوغ هر یک از سرمایه‌های شش‌گانه تدوین کرده است. ...",
      "data": null
    }
  ]
}
```

---

## 7. Frontend integration notes

1. **Rendering order** — iterate `data.sections` in array order; `order` is already ascending. Do not re-sort by title.
2. **Navigation/anchors** — use `key` as the stable anchor id: `#executive-summary`, `#natural-capital`, `#risk-management`, etc.
3. **Language** — `title` / `labelFa` / `description` are Persian (RTL). `titleEn` / `label` are English for the LTR locale or tooltips.
4. **Direction** — the UI is RTL; align score bars, maturity chips, and grids from the right.
5. **Score/maturity visuals** —
   - Render score (0–100) as a progress bar/radial gauge.
   - Use the `maturity.color`, `maturity.emoji`, and `maturity.labelFa` for level chips.
   - `score === null` → "no data" state (greyed), not 0.
6. **Comparison badges** — when `comparison` is non-null on a node, show a delta badge: `+4.3` (green up) or `-2.1` (red down) vs the comparison `value`. Compute the delta as `score - comparison.value`.
7. **Capital sections** — the recommended layout is a **capital card** (title + score gauge + maturity chip) followed by a drill-down of domains → components → capabilities. Use `data.capital.domains` as the source.
8. **Risk management section** — render `data.risks` as KPI cards (`total`, `active`, `archived`) plus distribution breakdowns for `byLevel`, `byState`, `byCapital` (e.g. horizontal bar or donut).
9. **Comparative analysis section** — when `data.comparison` exists, render a side-by-side or delta table of the capital scores between `period` (main) and `comparison.period`.
10. **Narrative sections** — `governance` and `outlook` have `data: null`; render the `description` as a full-width text block (optionally with the title as a heading).
11. **Empty state** — every section always has a `description`; only `data` can be `null`. Design each section so it degrades gracefully to a description-only card.
