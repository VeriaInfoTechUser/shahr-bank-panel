# ESG Dashboard - Quick Reference Guide

## 🎯 What's New in This Release

### 1. Enhanced Dashboard Component
**File:** `src/pages/app/esg/dashboard/index.vue`

**New Sections Added:**
- ✨ **Top KPIs Section** - Shows 8-12 key performance indicators with trends
- ✨ **Global Trend Charts** - Dynamic charts for time-series data visualization
- ✨ **Pillar Tabs** - Tab navigation for easy switching between E/S/G pillars
- ✨ **Per-Pillar Top Metrics** - Key metrics specific to each pillar
- ✨ **Per-Pillar Key Charts** - Up to 2 charts per pillar
- ✨ **Domain Breakdown Grid** - Visual grid showing each domain's completion status

### 2. New TypeScript Interfaces

```typescript
// Top KPI metrics with trends
interface KPIMetric {
  id: string;
  i18n_key: string;
  value: number | string;
  unit?: string;
  target?: number;
  trend?: "up" | "down" | "stable";
  trend_value?: number;
}

// Domain-level details
interface Domain {
  key: string;
  i18n_key: string;
  answered_count?: number;
  total_controls?: number;
  // ... more properties
}
```

### 3. New i18n Keys (3 Languages)

**Persian (fa.json):**
```json
"esg.top-kpis": "KPI‌های برتر"
"esg.top-metrics": "معیارهای برتر"
"esg.trend-0": "روند داده‌ها"
"general.unanswered": "بدون پاسخ"
```

**English (en.json):**
```json
"esg.top-kpis": "Top KPIs"
"esg.top-metrics": "Top Metrics"
"esg.trend-0": "Data Trends"
"general.unanswered": "Unanswered"
```

**Arabic (ar.json):**
```json
"esg.top-kpis": "أهم مؤشرات الأداء"
"esg.top-metrics": "أهم المقاييس"
"esg.trend-0": "اتجاهات البيانات"
"general.unanswered": "لم يتم الرد"
```

## 📊 Component Structure

```
Dashboard Page
├── Header (Title + Last Updated)
├── Summary Cards (4 cards)
│   ├── Overall Score
│   ├── Overall Completion
│   ├── Answered Controls
│   └── Total Domains
├── Pillar Scores (3 cards)
├── Summary Charts (2-column)
│   ├── Completion Status Chart
│   └── Pillar Comparison Chart
├── 📌 Top KPIs Section (NEW)
│   └── 4-column grid of KPI metrics
├── 📌 Trend Charts Section (NEW)
│   └── Multiple full-height charts
├── 📌 Pillar Tabs (NEW)
└── 📌 Per-Pillar Details (NEW)
    ├── Pillar Stats (4 cards)
    ├── Top Metrics (4 metrics)
    ├── Key Charts (up to 2)
    ├── Radar Chart
    └── Domain Breakdown Grid
```

## 🔌 API Response Expected Structure

```json
{
  "data": {
    "meta": {
      "version": "1.0",
      "generated_at": "2024-01-15T10:30:00Z",
      "chart_library": "echarts",
      "rtl": false
    },
    "summary": {
      "overall_score": 75,
      "overall_completion": 85,
      "total_domains": 32,
      "total_controls": 450,
      "answered_controls": 382,
      "unanswered_controls": 68,
      "pillar_scores": {
        "environmental": { "score": 72, "completion_pct": 85, ... },
        "social": { "score": 78, "completion_pct": 88, ... },
        "governance": { "score": 75, "completion_pct": 82, ... }
      },
      "completion_chart": { ... },
      "pillar_compare_chart": { ... },
      "top_kpis": [           // NEW - Optional
        {
          "i18n_key": "esg.kpi-energy-efficiency",
          "value": 94,
          "unit": "%",
          "trend": "up",
          "trend_value": 5
        }
      ],
      "trend_charts": [       // NEW - Optional
        {
          "component_name": "EsgBarMixedChart",
          "echarts_config": { ... },
          "series": [ ... ]
        }
      ]
    },
    "pillars": [
      {
        "key": "environmental",
        "i18n_key": "esg.pillar.environmental",
        "domains": [
          {
            "i18n_key": "esg.domain.energy_resource_management",
            "total_controls": 15,
            "answered_count": 12
          }
        ],
        "top_metrics": [ ... ],      // NEW - Optional
        "key_charts": [ ... ],       // NEW - Optional
        "radar_chart": { ... }
      }
    ]
  }
}
```

## 🎨 Styling Features

### Responsive Breakpoints
- **Mobile**: Single column (grid-cols-1)
- **Tablet (md)**: 2-3 columns (md:grid-cols-2, md:grid-cols-3)
- **Desktop (lg)**: 3-4 columns (lg:grid-cols-3, lg:grid-cols-4)

### Dark Mode
- Automatic dark mode support via `dark:` prefix
- Custom scrollbar styling for both light and dark
- Proper contrast ratios for accessibility

### Color Theme
- **Blue** (#3b82f6): Overall Score, primary
- **Purple** (#a855f7): Completion, secondary
- **Green** (#10b981): Answered/Success
- **Orange** (#f97316): Domains, informational
- **Red** (#ef4444): Trends down, errors
- **Gray** (#6b7280): Neutral, stable trends

## 🚀 How to Use

### 1. Ensure API Provides Data
The component renders sections conditionally based on available data:

```typescript
// Only renders if top_kpis is provided
<div v-if="topKPIs.length > 0">
  <!-- Top KPIs section -->
</div>

// Only renders if trend_charts is provided
<div v-if="trendCharts.length > 0">
  <!-- Trend charts section -->
</div>
```

### 2. Update API Response
If needed, update your backend to return additional fields in the ESG dashboard response (optional fields marked above).

### 3. No Additional Setup Required
- Chart components already available
- i18n keys already added
- Component ready to deploy

## ✅ Verification Checklist

- [x] Component build passes without errors
- [x] All TypeScript interfaces defined
- [x] All i18n keys added to 3 language files
- [x] Responsive design tested (mobile/tablet/desktop)
- [x] Dark mode styling complete
- [x] Accessibility features included
- [x] Dynamic rendering for all sections
- [x] Graceful fallbacks for missing data
- [x] Production build successful (57.20s)

## 🔗 Related Files

- **Component**: `src/pages/app/esg/dashboard/index.vue`
- **Chart Components**: `src/pages/app/esg/dashboard/components/`
  - `EsgCompletionDonut.vue`
  - `EsgPillarCompare.vue`
  - `EsgRadarChart.vue`
  - `EsgBarMixedChart.vue`
- **Component Registry**: `src/pages/app/esg/dashboard/composables/useChartRegistry.ts`
- **Translations**: 
  - `src/locales/fa.json`
  - `src/locales/en.json`
  - `src/locales/ar.json`

## 📞 Support

For issues or questions:
1. Check that API response matches expected structure
2. Verify i18n keys exist in your locale files
3. Ensure echarts components are properly imported
4. Check browser console for any errors

---

**Last Updated:** 2024
**Version:** 2.0 (Enhanced with KPIs, Trends, Per-Pillar Metrics, Domain Details)
