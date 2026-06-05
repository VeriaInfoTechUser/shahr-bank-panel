# ESG Report API Documentation

## Data Shape & Types

### ReportData (Root)

```typescript
interface ReportData {
  meta: MetaData
  key_figures: KeyFigure[]
  environmental: EnvironmentalSection
  social: SocialSection
  governance: GovernanceSection
  narratives: Narratives
}
```

### MetaData

```typescript
interface MetaData {
  generated_at: string // ISO 8601 date string
  reporting_year: number
  organization_name?: string
  fiscal_year?: string
  last_updated?: string
}
```

**Example:**
```json
{
  "generated_at": "2024-01-15T10:30:00Z",
  "reporting_year": 2023,
  "organization_name": "شاهر بانک",
  "fiscal_year": "2023"
}
```

---

### KeyFigure

```typescript
interface KeyFigure {
  id: string
  label: string // "کل انتشار گازهای گلخانه ای"
  value: number
  unit: string // "tonnes CO2e", "MWh", "%"
  category?: string // "ghg", "energy", "workforce"
  year?: number
  previousYear?: number
  trend?: 'up' | 'down' | 'stable'
  framework?: string // "GRI", "TCFD", "SASB"
}
```

**Example:**
```json
{
  "id": "ghg_total_2023",
  "label": "کل انتشار گازهای گلخانه ای",
  "value": 250000,
  "unit": "tonnes CO2e",
  "category": "ghg",
  "year": 2023,
  "previousYear": 2022,
  "trend": "down",
  "framework": "GRI"
}
```

---

### EnvironmentalSection

```typescript
interface EnvironmentalSection {
  climate: SectionData
  ghg: SectionData // GHG Emissions (Scopes 1, 2, 3)
  energy: SectionData
  water: SectionData
  waste: SectionData
}

interface SectionData {
  controls: ControlData[]
  metrics?: Record<string, number | string>
  insights?: string[]
}

interface ControlData {
  id: string
  title: string
  description?: string
  value?: number | string
  unit?: string
  framework?: string // "GRI", "TCFD", "SASB", "ISO"
  scope?: 'scope_1' | 'scope_2' | 'scope_3' | string
  status?: 'active' | 'inactive' | 'pending'
  year?: number
  percentage?: number
  change?: number // +5 or -3
}
```

**Example GHG Control:**
```json
{
  "id": "ghg_scope1_fuel",
  "title": "Scope 1: مستقیم (سوخت)",
  "value": 45000,
  "unit": "tonnes CO2e",
  "framework": "GRI",
  "scope": "scope_1",
  "status": "active",
  "year": 2023,
  "percentage": 18,
  "change": -2
}
```

---

### SocialSection

```typescript
interface SocialSection {
  workforce: SectionData
  dei: SectionData // Diversity, Equity, Inclusion
  health_safety: SectionData
}
```

**Workforce Controls:**
```json
{
  "id": "workforce_total",
  "title": "کل کارمندان",
  "value": 5250,
  "unit": "persons",
  "year": 2023
}
```

**DEI Controls:**
```json
{
  "id": "dei_female_leadership",
  "title": "رهبری زنان",
  "value": 28,
  "unit": "%",
  "percentage": 28,
  "change": 3
}
```

**Health & Safety Controls:**
```json
{
  "id": "hs_injury_rate",
  "title": "میزان جراحت",
  "value": 2.5,
  "unit": "per million hours",
  "year": 2023,
  "change": -0.5
}
```

---

### GovernanceSection

```typescript
interface GovernanceSection {
  board: SectionData
  ethics: SectionData
  compliance: SectionData
}
```

**Board Controls:**
```json
{
  "id": "board_size",
  "title": "اندازه هیات مدیره",
  "value": 12,
  "unit": "members"
}
```

**Ethics Controls:**
```json
{
  "id": "ethics_training",
  "title": "تدریس اخلاقیات",
  "value": 95,
  "unit": "%",
  "percentage": 95
}
```

---

### Narratives

```typescript
interface Narratives {
  about_report: NarrativeSection
  environmental: NarrativeSection
  social: NarrativeSection
  governance: NarrativeSection
  report_conclusion: NarrativeSection
}

interface NarrativeSection {
  title: string // In Persian for RTL display
  body: string // Markdown or plain text with embedded metrics
}
```

**Example:**
```json
{
  "title": "درباره این گزارش",
  "body": "این گزارش پایداری شاهر بانک برای سال ۱۴۰۲ است..."
}
```

---

## API Endpoints

### Fetch Report

**Endpoint:** `POST /api/content/report`

**Request:**
```json
{
  "year": 2023,
  "format": "json"
}
```

**Response:** `200 OK`
```json
{
  "meta": { ... },
  "key_figures": [ ... ],
  "environmental": { ... },
  "social": { ... },
  "governance": { ... },
  "narratives": { ... }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Report not found for year
- `500 Internal Server Error` - Server error

---

## Service Usage

### Fetch Report with Caching

```typescript
import { reportService } from '@/services/reportService'

// Fetch (uses 1-day cache)
const report = await reportService.fetchReport(2023)

// Force refresh (bypass cache)
const freshReport = await reportService.fetchReport(2023, true)

// Clear cache
reportService.clearCache()
```

### Error Handling

```typescript
import { AppError, getUserErrorMessage, logError } from '@/utils/errorHandler'

try {
  const report = await reportService.fetchReport()
} catch (error) {
  if (error instanceof AppError) {
    console.error(error.userMessage) // Show to user
    logError(error) // Log with monitoring service
  }
}
```

---

## Component Props

### ReportContainer

```typescript
interface Props {
  year?: number // Default: current year
  autoLoad?: boolean // Default: true
  onError?: (error: Error) => void
  onSuccess?: (report: ReportData) => void
}
```

### DetailComponent (Environmental, Social, Governance)

```typescript
interface Props {
  title: string
  narrative?: NarrativeSection
  controls: ControlData[]
  loading?: boolean
  error?: Error | null
}
```

### DataTable

```typescript
interface Props {
  columns: {
    key: string
    label: string
    sortable?: boolean
    filterable?: boolean
    format?: (value: any) => string
  }[]
  data: any[]
  searchPlaceholder?: string
  defaultSort?: { key: string; direction: 'asc' | 'desc' }
  framework?: string // Filter by framework
}
```

---

## Common Patterns

### Safely Access Nested Data

```typescript
import { safeAccess } from '@/utils/errorHandler'

// With fallback
const emissions = safeAccess(report, 'environmental.ghg.controls[0].value', 0)

// Access array item
const firstControl = safeAccess(report, 'environmental.climate.controls.0', null)
```

### Format Numbers for Display

```typescript
// Persian locale (۰-۹ digits)
const formatted = new Intl.NumberFormat('fa-IR').format(250000)
// Output: "۲۵۰٬۰۰۰"

// With unit
const formatted = new Intl.NumberFormat('fa-IR', {
  style: 'decimal',
  maximumFractionDigits: 1,
}).format(2.5)
// Output: "۲.۵"
```

### Calculate Trends

```typescript
function calculateTrend(current: number, previous: number): {
  change: number
  percentage: number
  direction: 'up' | 'down' | 'stable'
} {
  const change = current - previous
  const percentage = (change / previous) * 100

  return {
    change,
    percentage: Math.round(percentage * 10) / 10,
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
  }
}
```

---

## Troubleshooting

### Issue: Report Not Loading

**Symptoms:** Blank screen, loading spinner never stops

**Solutions:**
1. Check network tab - is `/api/content/report` responding?
2. Verify `reportService` is initialized properly
3. Check browser console for error messages
4. Verify `ErrorBoundary` is wrapping the app

**Debug:**
```typescript
// In console
localStorage.removeItem('esg_report_cache')
location.reload()
```

---

### Issue: Data Not Displaying

**Symptoms:** Correct API call but empty sections

**Solutions:**
1. Verify data structure matches expected format
2. Check Persian translations exist in i18n files
3. Verify narrative data includes title and body
4. Check controls array is not empty

**Debug:**
```typescript
// Check cached data
const cached = localStorage.getItem('esg_report_cache')
console.log(JSON.parse(cached || '{}'))
```

---

### Issue: Styling Broken on Mobile

**Symptoms:** Text overlapping, tables not scrollable

**Solutions:**
1. Verify responsive breakpoints are correct
2. Check `@media (max-width:)` queries in SCSS
3. Verify `dir="rtl"` attribute on root element
4. Check viewport meta tag in HTML

---

### Issue: Performance Slow

**Symptoms:** Lag when switching tabs, charts render slowly

**Solutions:**
1. Enable lazy loading: `<component v-if="isVisible" :is="DetailComponent" />`
2. Use virtualization for long tables
3. Check performance tab - identify bottlenecks
4. Disable dev tools during testing

**Debug:**
```typescript
import { PerformanceMonitor } from '@/utils/performance'

const perf = new PerformanceMonitor()
perf.mark('section-render')
// ... render section
const metric = perf.measure('section-render')
console.log(`Rendered in ${metric.duration}ms`)
```

---

### Issue: Keyboard Navigation Not Working

**Symptoms:** Tab key doesn't move focus, Enter doesn't activate buttons

**Solutions:**
1. Verify `tabindex="0"` on interactive elements
2. Check `focus` CSS is not hidden
3. Verify `role` attributes are correct
4. Check `aria-label` on icon-only buttons

---

### Issue: Screen Reader Announcements Missing

**Symptoms:** Screen reader reads nothing, skips content

**Solutions:**
1. Add `aria-live="polite"` to status areas
2. Use `aria-label` for icon buttons
3. Use `aria-describedby` for descriptions
4. Verify all form labels have `htmlFor` attribute

---

### Issue: Export (PDF/Excel) Not Working

**Symptoms:** "Export failed" message or nothing happens

**Solutions:**
1. Verify libraries installed: `npm install html2pdf xlsx`
2. Check browser console for errors
3. Verify report data is loaded
4. Try export in Chrome (best support)

---

### Issue: Dark Mode Not Toggling

**Symptoms:** Toggle button exists but theme doesn't change

**Solutions:**
1. Verify `ThemeProvider` wraps entire app
2. Check CSS variables use `var(--bg-primary)` not hard-coded colors
3. Verify `data-theme="dark"` attribute on root
4. Clear browser cache and local storage

---

## Advanced Usage

### Custom Monitoring Integration

```typescript
import { initializeErrorMonitoring } from '@/utils/errorHandler'
import * as Sentry from '@sentry/vue'

initializeErrorMonitoring({
  captureException: (error, context) => Sentry.captureException(error, { extra: context }),
  captureMessage: (msg, level) => Sentry.captureMessage(msg, level),
})
```

### Virtualize Large Tables

```typescript
import { VirtualScroller } from '@/utils/performance'

const scroller = new VirtualScroller({
  itemHeight: 48,
  visibleCount: 15,
  totalCount: 10000,
})

const range = scroller.getVisibleRange(scrollTop)
console.log(range.visibleItems) // [0, 1, 2, ... 24]
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@/utils/performance'

const perf = new PerformanceMonitor()

perf.mark('api-call')
await fetchReport()
const apiMetric = perf.measure('api-call')

perf.logMetrics() // Print all metrics
```

---

## Best Practices

✅ **DO:**
- Always use `safeAccess()` for nested data
- Wrap app in `ErrorBoundary`
- Use `reportService` for fetching (includes caching)
- Test accessibility with screen reader
- Use CSS variables for theming

❌ **DON'T:**
- Hard-code API URLs in components
- Directly access localStorage (use service)
- Ignore ARIA warnings in console
- Use hard-coded colors (use CSS variables)
- Fetch same data in multiple components

---

## Performance Targets

- Initial load: < 2 seconds
- Tab switch: < 500ms
- Export (PDF): < 5 seconds
- Lazy load images: < 1 second when visible
- Virtual scroll (10,000 rows): 60 FPS
- Bundle size: < 500 KB (gzipped)

---

## Support

For issues or questions:
1. Check this documentation
2. Search Troubleshooting section
3. Check browser console for errors
4. File issue with error details and steps to reproduce
