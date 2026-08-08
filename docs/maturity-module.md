# Maturity Module — Frontend API Documentation

This document describes the **Maturity module** API for the frontend admin panel. The module is **read-only**: it derives all maturity data from the **calculation module** (`calculationCapability.percent` per capability per period) joined with the **sustainability referential tree** (capital → domain → component → capability → indicator/claim).

Use it to build the three admin pages:

- **Dashboard** — `GET /api/v1/maturity/dashboard`
- **Capability list** — `GET /api/v1/maturity`
- **Capability detail** (indicators + data) — `GET /api/v1/maturity/capabilities/:capabilitySlug`
- (extra) **Compare two periods** — `GET /api/v1/maturity/compare`
- (extra) **Report generation** — `GET /api/v1/maturity/reports/:type`

Base URL: `/api/v1`

---

## Table of Contents

- [1. Common conventions](#1-common-conventions)
  - [1.1 API envelope](#11-api-envelope)
  - [1.2 Authentication](#12-authentication)
  - [1.3 Period types](#13-period-types)
  - [1.4 Maturity levels](#14-maturity-levels)
  - [1.5 Period resolution defaults](#15-period-resolution-defaults)
- [2. Endpoints at a glance](#2-endpoints-at-a-glance)
- [3. Capability list](#3-capability-list)
- [4. Dashboard](#4-dashboard)
- [5. Capability detail](#5-capability-detail)
- [6. Compare two periods](#6-compare-two-periods)
- [7. Reports](#7-reports)
- [8. Frontend page mapping](#8-frontend-page-mapping)

---

## 1. Common conventions

### 1.1 API envelope

Every response is wrapped in a standard envelope:

```json
{
  "result": true,
  "data": { ... },
  "error": []
}
```

| Field | Type | Description |
|---|---|---|
| `result` | boolean | `true` on success, `false` on error |
| `data` | object / array | Payload. `null` on error. |
| `error` | string[] | Human-readable error messages. Empty on success. |

For **paginated** endpoints the `data` shape is `{ list, paginator }`:

```json
{
  "result": true,
  "data": {
    "list": [ ... ],
    "paginator": { "count": 120, "limit": 25, "page": 1 }
  },
  "error": []
}
```

### 1.2 Authentication

All endpoints require a JWT bearer token (`Authorization: Bearer <token>`). Routes are protected by the global JWT + roles guard chain.

### 1.3 Period types

| Value | Label |
|---|---|
| `DAILY` | Daily |
| `WEEKLY` | Weekly |
| `MONTHLY` | Monthly |
| `QUARTERLY` | Quarterly |
| `YEARLY` | Yearly (default) |

`period_type` is always one of these strings. Invalid values → `400`.

### 1.4 Maturity levels

Levels are derived from the calculated percent via `resolveMaturityLevel`:

| Level | Name | Score range |
|---|---|---|
| 1 | Initial | 0 – 20 |
| 2 | Managed | 20 – 40 |
| 3 | Defined | 40 – 60 |
| 4 | Measured | 60 – 80 |
| 5 | Optimized | 80 – 100 |

A capability **without** a stored calculation row for the period is **excluded** from list/dashboard aggregates (treated as "not assessed").

### 1.5 Period resolution defaults

For `period_type`, `date_from`, `date_to`:

- If `date_from` **and** `date_to` are provided → used as the period range.
- Otherwise → the **latest completed period** for that `period_type` is used.
- If no calculation exists at all → previous calendar year (`{currentYear-1}-01-01` … `{currentYear-1}-12-31`).

Dates are formatted `YYYY-MM-DD`.

---

## 2. Endpoints at a glance

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/maturity` | Paginated list of capabilities with percent + level for a period |
| `GET` | `/maturity/dashboard` | KPIs, charts and tables for a period (optional comparison) |
| `GET` | `/maturity/capabilities/:capabilitySlug` | Detail for one capability: indicators, claims, historical, risks |
| `GET` | `/maturity/compare` | Compare two explicit periods |
| `GET` | `/maturity/reports/:type` | Pre-shaped report payload by type |

---

## 3. Capability list

```
GET /api/v1/maturity
```

### Query parameters

| Field | Type | Default | Description |
|---|---|---|---|
| `period_type` | string | `YEARLY` | One of `DAILY`/`WEEKLY`/`MONTHLY`/`QUARTERLY`/`YEARLY` |
| `date_from` | string | latest period | Period start `YYYY-MM-DD` |
| `date_to` | string | latest period | Period end `YYYY-MM-DD` |
| `page` | number | `1` | Page number (1-based) |
| `limit` | number | `25` | Items per page |
| `capitalSlug` | string[] | - | Filter by capital slug(s), e.g. `["CAP-NAT"]` |
| `domainSlug` | string[] | - | Filter by domain slug(s), e.g. `["DOM-NAT-001"]` |
| `componentSlug` | string[] | - | Filter by component slug(s) |
| `capabilitySlug` | string[] | - | Filter by capability slug(s) |
| `maturityLevel` | number[] | - | Filter by resolved level(s), e.g. `[3,4]` |
| `targetLevel` | number[] | - | Filter by required/target level(s) |
| `minScore` | number | - | Minimum score (percent), 0–100 |
| `maxScore` | number | - | Maximum score (percent), 0–100 |

Multiple values for array filters can be passed as repeated query params (`capitalSlug=CAP-NAT&capitalSlug=CAP-HUM`) or comma-separated (`capitalSlug=CAP-NAT,CAP-HUM`).

### Example

```
GET /api/v1/maturity?period_type=YEARLY&date_from=2024-01-01&date_to=2024-12-31&page=1&limit=50
```

### Response item (`MaturityListResponseDto`)

| Field | Type | Always present | Description |
|---|---|---|---|
| `capabilitySlug` | string | Yes | Capability slug |
| `capabilityTitle` | string | Yes | Capability title |
| `capitalSlug` | string | Yes | Parent capital slug |
| `capitalTitle` | string | No | Parent capital title |
| `capitalType` | string | No | Capital type (`NAT`, `HUM`, `SOC`, `INS`, `TEC`, `FEC`) |
| `domainSlug` | string | Yes | Parent domain slug |
| `domainTitle` | string | No | Parent domain title |
| `componentSlug` | string | No | Parent component slug |
| `componentTitle` | string | No | Parent component title |
| `score` | number | Yes | Calculated percent for the period |
| `percentage` | number | Yes | Same as `score` (percent) |
| `maturityLevel` | number | Yes | Resolved level 1–5 |
| `requiredMaturity` | number | No | Target level defined in the referential |
| `gap` | number | No | `max(0, requiredMaturity - maturityLevel)` |
| `trend` | string | No | Reserved (`undefined` in list; see dashboard) |

### Full example response

```json
{
  "result": true,
  "data": {
    "list": [
      {
        "capabilitySlug": "CAPA-NAT-001-01-01",
        "capabilityTitle": "ایجاد حاکمیت و پاسخ‌گویی",
        "capitalSlug": "CAP-NAT",
        "capitalTitle": "سرمایه طبیعی",
        "capitalType": "NAT",
        "domainSlug": "DOM-NAT-001",
        "domainTitle": "مدیریت اقلیم و گازهای گلخانه‌ای",
        "componentSlug": "COM-NAT-001-01",
        "componentTitle": "حاکمیت و برنامه‌ریزی",
        "score": 78.5,
        "percentage": 78.5,
        "maturityLevel": 4,
        "requiredMaturity": 4,
        "gap": 0
      }
    ],
    "paginator": { "count": 1, "limit": 25, "page": 1 }
  },
  "error": []
}
```

---

## 4. Dashboard

```
GET /api/v1/maturity/dashboard
```

### Query parameters

| Field | Type | Default | Description |
|---|---|---|---|
| `date_from` | string | latest period | Period start `YYYY-MM-DD` |
| `date_to` | string | latest period | Period end `YYYY-MM-DD` |
| `period_type` | string | `YEARLY` | Aggregation period type |
| `compare_period_type` | string | - | Comparison period type (must equal `period_type`) |
| `compare_date_from` | string | - | Comparison period start |
| `compare_date_to` | string | - | Comparison period end |
| `capitalSlug` | string[] | - | Restrict to capital(s) |
| `domainSlug` | string[] | - | Restrict to domain(s) |
| `capabilitySlug` | string[] | - | Restrict to capability(ies) |

**Comparison rules**: if any `compare_*` param is present, **all three** (`compare_period_type`, `compare_date_from`, `compare_date_to`) are required and `compare_period_type` must equal `period_type`, otherwise → `400`.

### Response (`MaturityDashboardResponseDto`)

| Field | Type | Description |
|---|---|---|
| `kpis` | object | See `MaturityKpiDto` below |
| `capitalMaturity` | CapitalMaturityDto[] | Per-capital score + level (radar / bar chart) |
| `domainMaturity` | DomainMaturityDto[] | Per-domain score + level (chart) |
| `capabilityRanking` | CapabilityPerformanceDto[] | Capabilities sorted by score desc (strongest → weakest) |
| `distribution` | MaturityDistributionDto[] | Count of capabilities per level 1–5 |
| `trend` | MaturityTrendPointDto[] | Portfolio avg score + level across all periods (line chart) |
| `gapAnalysis` | MaturityGapDto[] | Current vs target level per capability, gap desc |
| `heatmap` | MaturityHeatmapCellDto[] | capital × domain × capability → level |
| `capabilityPerformance` | CapabilityPerformanceDto[] | Full performance table with `trend` |
| `improvementOpportunities` | ImprovementOpportunityDto[] | Capabilities with `gap > 0`, sorted by gap desc |
| `periodSummary` | PeriodSummaryDto[] | Score + level per distinct period (table) |
| `date_from` | string | Resolved period start |
| `date_to` | string | Resolved period end |
| `period_type` | string | Resolved period type |

### `MaturityKpiDto`

| Field | Type | Description |
|---|---|---|
| `overallMaturityLevel` | number | Level of the average score (1–5) |
| `overallScore` | number | Average percent across assessed capabilities |
| `assessedCapabilities` | number | Count of capabilities with calculation data |
| `evaluatedCapitals` | number | Count of capitals having at least one assessed capability |
| `improvementTrend` | string | `up` / `down` / `flat` vs comparison or previous period |
| `trendDelta` | number | Score change vs comparison or previous period |

### `CapabilityPerformanceDto`

| Field | Type |
|---|---|
| `capabilitySlug` | string |
| `capabilityTitle` | string |
| `capitalSlug` | string |
| `domainSlug` | string |
| `score` | number |
| `percentage` | number |
| `maturityLevel` | number |
| `trend` | string (`up`/`down`/`flat`) |

### `CapitalMaturityDto`

| Field | Type | Description |
|---|---|---|
| `capitalSlug` | string | Capital slug |
| `capitalTitle` | string | Capital title |
| `capitalType` | string | `NAT`/`HUM`/`SOC`/`INS`/`TEC`/`FEC` |
| `level` | number | Level of the capital average score |
| `score` | number | Average percent across the capital's capabilities |

### `DomainMaturityDto`

| Field | Type |
|---|---|
| `domainSlug` | string |
| `domainTitle` | string |
| `capitalSlug` | string |
| `level` | number |
| `score` | number |

### `MaturityDistributionDto`

| Field | Type |
|---|---|
| `level` | number (1–5) |
| `count` | number |

### `MaturityTrendPointDto`

| Field | Type | Description |
|---|---|---|
| `period` | string | Year (for YEARLY) or `date_from` |
| `date_from` | string | Period start |
| `date_to` | string | Period end |
| `score` | number | Portfolio average percent |
| `maturityLevel` | number | Level of that score |

### `MaturityGapDto`

| Field | Type |
|---|---|
| `capabilitySlug` | string |
| `currentLevel` | number |
| `targetLevel` | number |
| `gap` | number |

### `MaturityHeatmapCellDto`

| Field | Type |
|---|---|
| `capitalSlug` | string |
| `domainSlug` | string |
| `capabilitySlug` | string |
| `maturityLevel` | number |

### `ImprovementOpportunityDto`

| Field | Type | Description |
|---|---|---|
| `capabilitySlug` | string | |
| `capabilityTitle` | string | |
| `currentLevel` | number | |
| `targetLevel` | number | |
| `gap` | number | |
| `priority` | string | `high` (gap ≥ 2) / `medium` (gap = 1) / `low` |

### `PeriodSummaryDto`

| Field | Type |
|---|---|
| `period` | string (year or `date_from`) |
| `date_from` | string |
| `date_to` | string |
| `score` | number |
| `maturityLevel` | number |

### Example response (abridged)

```json
{
  "result": true,
  "data": {
    "kpis": {
      "overallMaturityLevel": 3,
      "overallScore": 62.5,
      "assessedCapabilities": 120,
      "evaluatedCapitals": 6,
      "improvementTrend": "up",
      "trendDelta": 3.2
    },
    "capitalMaturity": [
      { "capitalSlug": "CAP-NAT", "capitalTitle": "سرمایه طبیعی", "capitalType": "NAT", "level": 4, "score": 68.2 }
    ],
    "domainMaturity": [
      { "domainSlug": "DOM-NAT-001", "domainTitle": "مدیریت اقلیم و گازهای گلخانه‌ای", "capitalSlug": "CAP-NAT", "level": 3, "score": 64.1 }
    ],
    "capabilityRanking": [
      { "capabilitySlug": "CAPA-NAT-001-01-01", "capabilityTitle": "ایجاد حاکمیت و پاسخ‌گویی", "capitalSlug": "CAP-NAT", "domainSlug": "DOM-NAT-001", "score": 78.5, "percentage": 78.5, "maturityLevel": 4, "trend": "flat" }
    ],
    "distribution": [
      { "level": 1, "count": 5 },
      { "level": 2, "count": 18 },
      { "level": 3, "count": 41 },
      { "level": 4, "count": 43 },
      { "level": 5, "count": 13 }
    ],
    "trend": [
      { "period": "2022", "date_from": "2022-01-01", "date_to": "2022-12-31", "score": 44.8, "maturityLevel": 3 },
      { "period": "2023", "date_from": "2023-01-01", "date_to": "2023-12-31", "score": 51.2, "maturityLevel": 3 },
      { "period": "2024", "date_from": "2024-01-01", "date_to": "2024-12-31", "score": 62.5, "maturityLevel": 4 }
    ],
    "gapAnalysis": [
      { "capabilitySlug": "CAPA-NAT-001-01-02", "currentLevel": 2, "targetLevel": 4, "gap": 2 }
    ],
    "heatmap": [
      { "capitalSlug": "CAP-NAT", "domainSlug": "DOM-NAT-001", "capabilitySlug": "CAPA-NAT-001-01-01", "maturityLevel": 4 }
    ],
    "capabilityPerformance": [
      { "capabilitySlug": "CAPA-NAT-001-01-01", "capabilityTitle": "ایجاد حاکمیت و پاسخ‌گویی", "capitalSlug": "CAP-NAT", "domainSlug": "DOM-NAT-001", "score": 78.5, "percentage": 78.5, "maturityLevel": 4, "trend": "up" }
    ],
    "improvementOpportunities": [
      { "capabilitySlug": "CAPA-NAT-001-01-02", "capabilityTitle": "برنامه‌ریزی اهداف", "currentLevel": 2, "targetLevel": 4, "gap": 2, "priority": "high" }
    ],
    "periodSummary": [
      { "period": "2023", "date_from": "2023-01-01", "date_to": "2023-12-31", "score": 51.2, "maturityLevel": 3 },
      { "period": "2024", "date_from": "2024-01-01", "date_to": "2024-12-31", "score": 62.5, "maturityLevel": 4 }
    ],
    "date_from": "2024-01-01",
    "date_to": "2024-12-31",
    "period_type": "YEARLY"
  },
  "error": []
}
```

---

## 5. Capability detail

```
GET /api/v1/maturity/capabilities/:capabilitySlug
```

Returns the full detail of one capability for a period: current maturity, historical trend, contributing indicators (with their calculated data), claims, and related risks.

### Query parameters

| Field | Type | Default | Description |
|---|---|---|---|
| `period_type` | string | `YEARLY` | Aggregation period type |
| `date_from` | string | latest period | Period start |
| `date_to` | string | latest period | Period end |

### Response (`CapabilityDetailDto`)

| Field | Type | Description |
|---|---|---|
| `capabilitySlug` | string | Capability slug |
| `capabilityTitle` | string | Capability title |
| `capitalSlug` | string | Parent capital slug |
| `capitalTitle` | string | No | Parent capital title |
| `domainSlug` | string | Parent domain slug |
| `domainTitle` | string | No | Parent domain title |
| `componentSlug` | string | No | Parent component slug |
| `currentMaturityLevel` | number | Resolved level 1–5 for the period (0 if not assessed) |
| `currentScore` | number | Calculated percent for the period (0 if not assessed) |
| `previousMaturityLevel` | number | Level of the previous period |
| `improvementTrend` | string | `up`/`down`/`flat` vs previous period |
| `targetLevel` | number | Required maturity from the referential |
| `maturityGap` | number | `max(0, targetLevel - currentMaturityLevel)` |
| `maturityStatus` | string | `assessed` when data exists, else `not_assessed` |
| `historical` | object[] | `{ period, maturityLevel, score }` per period (asc) |
| `claims` | ClaimItemDto[] | Referential claims whose `parentSlug` = capability slug |
| `indicators` | IndicatorContributionDto[] | Indicator calculations for the capability in the period |
| `evidence` | EvidenceItemDto[] | Always `[]` for now (reserved) |
| `weakAreas` | string[] | Gap message(s) when `maturityGap > 0` |
| `relatedRisks` | string[] | Risk slugs mapped to this capability (operational) |
| `relatedTasks` | string[] | Always `[]` (reserved) |
| `relatedPeriods` | string[] | Years the capability has calculations |
| `relatedImprovementPlans` | string[] | Always `[]` (reserved) |

### `IndicatorContributionDto`

| Field | Type | Description |
|---|---|---|
| `slug` | string | Indicator slug |
| `title` | string | Indicator title (from referential) |
| `score` | number | Indicator percent (0 if no data) |
| `status` | string | `contributing` when it has data, else `no_data` |
| `contribution` | number | Equal weight `1 / indicatorCount` |

### `ClaimItemDto`

| Field | Type |
|---|---|
| `slug` | string |
| `title` | string |
| `status` | string (`claimType`, e.g. `EXIST`, `DESIGN`) |
| `indicatorSlugs` | string[] (always `[]` for now) |

### Example response (abridged)

```json
{
  "result": true,
  "data": {
    "capabilitySlug": "CAPA-NAT-001-01-01",
    "capabilityTitle": "ایجاد حاکمیت و پاسخ‌گویی",
    "capitalSlug": "CAP-NAT",
    "capitalTitle": "سرمایه طبیعی",
    "domainSlug": "DOM-NAT-001",
    "domainTitle": "مدیریت اقلیم و گازهای گلخانه‌ای",
    "componentSlug": "COM-NAT-001-01",
    "currentMaturityLevel": 4,
    "currentScore": 78.5,
    "previousMaturityLevel": 3,
    "improvementTrend": "up",
    "targetLevel": 4,
    "maturityGap": 0,
    "maturityStatus": "assessed",
    "historical": [
      { "period": "2023", "maturityLevel": 3, "score": 56.2 },
      { "period": "2024", "maturityLevel": 4, "score": 78.5 }
    ],
    "claims": [
      { "slug": "CLM-NAT-001-01-01-01", "title": "ساختار، نقش‌ها و منابع ضروری ...", "status": "EXIST", "indicatorSlugs": [] }
    ],
    "indicators": [
      { "slug": "IND-NAT-001-01", "title": "مصرف آب در فرآیند خنک‌سازی", "score": 72.4, "status": "contributing", "contribution": 0.33 }
    ],
    "evidence": [],
    "weakAreas": [],
    "relatedRisks": ["RISK-001", "RISK-014"],
    "relatedTasks": [],
    "relatedPeriods": ["2023", "2024"],
    "relatedImprovementPlans": []
  },
  "error": []
}
```

**Errors**: `404` when the capability slug is not present in the sustainability referential.

---

## 6. Compare two periods

```
GET /api/v1/maturity/compare
```

### Query parameters

| Field | Type | Required | Description |
|---|---|---|---|
| `period_type` | string | Yes | Aggregation period type |
| `from_date_from` | string | Yes | "From" period start |
| `from_date_to` | string | Yes | "From" period end |
| `to_date_from` | string | Yes | "To" period start |
| `to_date_to` | string | Yes | "To" period end |
| `capitalSlug` | string[] | No | Restrict to capital(s) |
| `domainSlug` | string[] | No | Restrict to domain(s) |
| `capabilitySlug` | string[] | No | Restrict to capability(ies) |

### Response (`MaturityCompareResponseDto`)

| Field | Type | Description |
|---|---|---|
| `from` | PeriodRefDto | Summary of the "from" period |
| `to` | PeriodRefDto | Summary of the "to" period |
| `overallScoreDelta` | number | `to.score - from.score` |
| `overallPercentageChange` | number | Relative change % |
| `overallLevelDelta` | number | `to.maturityLevel - from.maturityLevel` |
| `capitalComparison` | MaturityComparisonDto[] | Per-capital comparison |
| `domainComparison` | MaturityComparisonDto[] | Per-domain comparison |
| `capabilityComparison` | MaturityComparisonDto[] | Per-capability comparison |
| `improvementAreas` | MaturityComparisonDto[] | Capabilities where score increased |
| `decliningAreas` | MaturityComparisonDto[] | Capabilities where score decreased |
| `gapAnalysis` | MaturityComparisonDto[] | Alias of `capabilityComparison` |

### `PeriodRefDto`

| Field | Type |
|---|---|
| `date_from` | string |
| `date_to` | string |
| `period_type` | string |
| `score` | number |
| `maturityLevel` | number |

### `MaturityComparisonDto`

| Field | Type |
|---|---|
| `slug` | string |
| `title` | string |
| `level` | string (`capital` / `domain` / `capability`) |
| `fromScore` | number |
| `toScore` | number |
| `scoreDelta` | number |
| `fromLevel` | number |
| `toLevel` | number |
| `levelDelta` | number |

---

## 7. Reports

```
GET /api/v1/maturity/reports/:type
```

### Path parameter `:type`

| Value | Description |
|---|---|
| `executive` | Executive summary: strengths, gaps, priorities, capital + capability tables |
| `capital` | Capital summary + capability table + trend + distribution |
| `domain` | Domain maturity + capability table + gap analysis |
| `capability` | Capability table + gap analysis + trend |
| `comparison` | Period summary + capability table + priorities + trend |

Invalid type → `400`.

### Query parameters

| Field | Type | Default | Description |
|---|---|---|---|
| `date_from` | string | latest period | Period start |
| `date_to` | string | latest period | Period end |
| `period_type` | string | `YEARLY` | Aggregation period type |
| `capitalSlug` | string | - | Restrict to one capital |
| `domainSlug` | string | - | Restrict to one domain |
| `capabilitySlug` | string | - | Restrict to one capability |

### Response (`MaturityReportResponseDto`)

| Field | Type | Description |
|---|---|---|
| `reportType` | string | The requested `:type` |
| `date_from` | string | Resolved period start |
| `date_to` | string | Resolved period end |
| `period_type` | string | Resolved period type |
| `overallMaturityLevel` | number | |
| `overallScore` | number | |
| `keyStrengths` | string[] | Titles of capabilities at level ≥ 4 (executive) |
| `majorGaps` | string[] | Capability slugs with gap ≥ 2 (executive) |
| `improvementPriorities` | string[] | Top 5 improvement titles (executive) |
| `capitalSummary` | CapitalSummaryTableDto[] | `{ capitalSlug, capitalTitle, score, percentage, maturityLevel, trend }` |
| `capabilitySummary` | CapabilitySummaryTableDto[] | `{ capabilitySlug, capabilityTitle, domainSlug, score, maturityLevel, gap }` |
| `improvementPriority` | ImprovementPriorityTableDto[] | `{ capabilitySlug, capabilityTitle, gap, priority, recommendation }` |
| `periodSummary` | PeriodSummaryDto[] | |
| `trend` | MaturityTrendPointDto[] | |
| `distribution` | MaturityDistributionDto[] | |
| `gapAnalysis` | MaturityGapDto[] | |
| `heatmap` | MaturityHeatmapCellDto[] | |
| `domainMaturity` | DomainMaturityDto[] | |
| `capabilityPerformance` | CapabilityPerformanceDto[] | |

---

## 8. Frontend page mapping

| Admin page | Endpoint(s) to call |
|---|---|
| **Dashboard** | `GET /maturity/dashboard` (add `compare_*` params to show previous-period comparison) |
| **Capability list** | `GET /maturity` (add `capitalSlug`/`domainSlug`/`maturityLevel`/`minScore`/`maxScore` filters; use `paginator` for paging) |
| **Capability detail** | `GET /maturity/capabilities/:capabilitySlug` |
| **Period selector** (shared) | Reuse `period_type` + `date_from` + `date_to` on every endpoint; available periods are listed in `periodSummary`/`trend` from the dashboard |
| **Compare page** (optional) | `GET /maturity/compare` |
| **Report page** (optional) | `GET /maturity/reports/:type` |

### Color coding suggestion by level (matches `DEFAULT_MATURITY_LEVELS`)

| Level | Color |
|---|---|
| 1 | `#EF4444` (red) |
| 2 | `#F97316` (orange) |
| 3 | `#EAB308` (yellow) |
| 4 | `#22C55E` (green) |
| 5 | `#16A34A` (green) |

### Notes for frontend developers

- `score`/`percentage` are the capability's **calculated percent**; `maturityLevel` is derived from it. Render the number + a level badge together.
- Capabilities **missing** from the list/dashboard have no calculation for the selected period — they are "not assessed" (see `maturityStatus` in capability detail).
- All period-aware endpoints share the same default resolution, so a selected period in the UI can be passed to every call consistently.
- Empty array filters are ignored; repeated params combine with OR inside a single filter field.
