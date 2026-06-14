# Composables Analysis

## Navigation & UI

| Composable | File | Purpose |
|------------|------|---------|
| `useBreadcrumb` | `useBreadcrumb.ts` | Generate breadcrumb items from route meta, supports prefix items |
| `useBreadcrumbSlot` | `useBreadcrumb.ts` | Inject toolbar content into breadcrumb row |
| `useGlobalModal` | `useGlobalModal.ts` | Open/close global modal with config |

## Data & Forms

| Composable | File | Purpose |
|------------|------|---------|
| `useValidate` | `useValidate.js` | Form validation helpers |
| `useValidationCache` | `useValidationCache.js` | Cache validation results |
| `useNumberFormat` | `useNumberFormat.js` | Format numbers (locale-aware) |
| `useAggregateList` | `useAggregateList.js` | Aggregate list data |
| `useCalculator` | `useCalculator.js` | Calculator utility |

## Network & Data

| Composable | File | Purpose |
|------------|------|---------|
| `useFetch` | `useFetch.js` | Generic data fetching |
| `useDownload` | `useDownload.js` | File download helper |
| `useESGReportLoader` | `useESGReportLoader.ts` | Load ESG report data |

## Status & Formatting

| Composable | File | Purpose |
|------------|------|---------|
| `commitmentSummary` | `commitmentSummary.ts` | Format commitment summaries |
| `riskOperationsStatusBadge` | `riskOperationsStatusBadge.ts` | Risk status badge formatting |
| `complianceOperationsStatusBadge` | `complianceOperationsStatusBadge.ts` | Compliance status badge |
| `complianceProgressLevelFilterOptions` | `complianceProgressLevelFilterOptions.ts` | Progress level filter options |
| `taskClauseNavigation` | `taskClauseNavigation.ts` | Navigate to task clauses |

## Auth & System

| Composable | File | Purpose |
|------------|------|---------|
| `useLogout` | `useLogout.js` | Logout handler |
| `useOSIcon` | `useOSIcon.js` | Detect OS for icon display |
| `useScroll` | `useScroll.js` | Scroll utilities |
| `useCountryFlag` | `useCountryFlag.js` | Country flag display |
| `graph` | `graph.js` | Graph/chart utilities |
