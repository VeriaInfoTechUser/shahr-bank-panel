# ESG Dashboard Implementation Guide

## Overview
A comprehensive, dynamic ESG Dashboard component for Vue 3 that displays Key Performance Indicators (KPIs) across three ESG sections: **Governance**, **Social**, and **Environmental**.

## Features

### ✅ Complete Implementation
- **Three Dynamic Sections**: Governance, Social, and Environmental
- **Beautiful Visualizations**: Apache ECharts (Radar, Donut, Pie, Horizontal Bar Charts)
- **KPI Heatmap**: Color-coded performance visualization (green ≥80%, amber 50-79%, red <50%)
- **Summary Statistics**: Total KPIs, Answered, Unanswered, Completion %, Average Score
- **Detailed Data Table**: Sortable, filterable KPI table with all metrics
- **Domain Cards**: Bottom section showing domain-specific KPIs with visual bars
- **Framework Coverage**: Shows framework mapping (GRI, ISSB, COSO, EcoVadis, TCFD)
- **RTL/Persian Support**: Full bi-directional text support
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **TypeScript Support**: Fully typed interfaces for all data structures

## Files Created

1. **`src/types/esg-dashboard.interface.ts`**
   - Complete TypeScript interfaces
   - Types for KPI, Domain, Section, Charts, and Dashboard data

2. **`src/components/ESGDashboard.vue`**
   - Main dashboard component
   - Vue 3 Composition API with `<script setup>`
   - Integrated Apache ECharts
   - Tailwind CSS styling
   - i18n support (en/fa/ar)

3. **`src/locales/en.json` & `src/locales/fa.json`**
   - i18n translations for all dashboard text

## Installation & Setup

### Dependencies (Already Installed)
```json
{
  "echarts": "^6.1.0",
  "vue-echarts": "^8.0.1"
}
```

### Import the Component

```vue
<template>
  <ESGDashboard 
    :section="'governance'" 
    :dashboardData="esgData"
    :reportingPeriod="'2024 Annual'"
  />
</template>

<script setup lang="ts">
import ESGDashboard from '@/components/ESGDashboard.vue';
import type { ESGDashboardData } from '@/types/esg-dashboard.interface';

const esgData: ESGDashboardData = {
  governance: { /* ... */ },
  social: { /* ... */ },
  environmental: { /* ... */ },
  reporting_period: '2024 Annual',
  last_updated: '2026-05-30T10:30:00Z'
};
</script>
```

## Component Props

```typescript
interface ESGDashboardProps {
  section: 'governance' | 'social' | 'environmental';  // Required: Current section
  dashboardData: ESGDashboardData;                     // Required: Full API response
  reportingPeriod?: string;                            // Optional: Reporting period
}
```

## Data Structure

### Complete ESG Data Format

```typescript
{
  result: true,
  data: {
    reporting_period: "2024 Annual",
    last_updated: "2026-05-30T10:30:00Z",
    total_kpis: 192,
    governance: {
      summary: {
        total_kpis: 72,
        answered: 71,
        unanswered: 1,
        completion: 98.6,
        avg_score: 81.4
      },
      domains: [
        {
          code: "GOV-CGS",
          title: "ساختار حاکمیت شرکتی",
          slug: "corporate-governance",
          order: 1,
          kpi_count: 6,
          answered: 6,
          avg_score: 58,
          kpis: [
            {
              code: "GOV-CGS-001",
              title: "تعداد اعضای هیئت‌مدیره...",
              value: 9,
              unit: "person",
              status: "answered",
              type: "person"
            },
            // ... more KPIs
          ]
        },
        // ... more domains
      ],
      all_kpis: [
        // Complete list of all KPIs across all domains
      ],
      framework_coverage: [
        { name: "GRI Standards", count: 84 },
        { name: "ISSB", count: 84 },
        // ... more frameworks
      ],
      charts: {
        radar_data: {
          categories: ["GOV-CGS", "GOV-CMP", ...],
          data: [{ name: "Governance", value: [...] }]
        },
        domain_bar_percent: [
          { domain: "GOV-CGS", value: 58, domainCode: "GOV-CGS" },
          // ...
        ],
        domain_bar_count: [...]
      },
      detailed_sections: [
        // Domain details for bottom cards
      ]
    },
    social: { /* ... same structure ... */ },
    environmental: { /* ... same structure ... */ }
  },
  error: null
}
```

## Visualization Details

### 1. Heatmap
- **Green** (≥80%): Excellent performance
- **Amber** (50-79%): Acceptable performance
- **Red** (<50%): Needs improvement
- **Grey**: Count/currency metrics (not color-coded by value)

### 2. Charts
- **Radar Chart**: Average KPI score per domain
- **Donut Chart**: Answered vs Unanswered KPI completion
- **Pie Chart**: Answer type distribution (percentage, count, currency, person)
- **Horizontal Bar Charts**: 
  - Average percentage scores per domain
  - Total count KPIs per domain
- **Framework Coverage** (Governance only): KPI count per framework

### 3. Domain Detail Cards
- Shows 6 KPIs per domain with visual progress bars
- Color-coded by performance (green/amber/red)
- Domain average score displayed prominently

## Styling & Colors

### ESG Theme Colors
```css
/* Success/Good */
#1D9E75 - Dark Green (≥80%)
#0F6E56 - Darker Green (labels)
#E1F5EE - Light Green (heatmap)

/* Warning/Acceptable */
#854F0B - Dark Amber (50-79%)
#FAEEDA - Light Amber (heatmap)
#BA7517 - Amber accent

/* Danger/Poor */
#A32D2D - Dark Red (<50%)
#E24B4A - Red accent
#FCEBEB - Light Red (heatmap)

/* Info/Neutral */
#378ADD - Blue (percentage data)
#534AB7 - Purple (count data)
#D85A30 - Orange (currency)
#9ca3af - Gray (unknown/neutral)
```

## Responsive Design

- **Desktop**: 4-column KPI cards, 2-column charts
- **Tablet**: 2-column KPI cards, 1-column charts
- **Mobile**: Full-width layout, single column

## i18n Support

### Supported Languages
- **English** (en) - Full support
- **Persian/Farsi** (fa) - Full support with RTL
- **Arabic** (ar) - Ready for translation

### Key Translation Keys
```
esg.governance
esg.social
esg.environmental
esg.totalKpis
esg.answered
esg.unanswered
esg.avgScore
esg.heatmap
esg.radarChart
esg.answerStatus
esg.answerTypeDistribution
esg.allKpisTable
... and many more
```

## Usage Examples

### Example 1: Display Governance Dashboard
```vue
<template>
  <div class="p-6">
    <ESGDashboard 
      section="governance"
      :dashboardData="data"
    />
  </div>
</template>

<script setup lang="ts">
import ESGDashboard from '@/components/ESGDashboard.vue';
import { onMounted, ref } from 'vue';

const data = ref(null);

onMounted(async () => {
  const response = await fetch('/api/esg-dashboard');
  data.value = await response.json();
});
</script>
```

### Example 2: Switch Between Sections
```vue
<template>
  <div>
    <div class="flex gap-4 mb-6">
      <button 
        v-for="sec in ['governance', 'social', 'environmental']"
        :key="sec"
        @click="activeSection = sec"
        :class="{ 'font-bold': activeSection === sec }"
      >
        {{ sec.toUpperCase() }}
      </button>
    </div>
    
    <ESGDashboard 
      :section="activeSection"
      :dashboardData="data"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ESGDashboard from '@/components/ESGDashboard.vue';

const activeSection = ref('governance');
const data = ref(null);
</script>
```

## Performance Optimizations

✅ **Already Implemented**:
- Computed properties for chart data (cached)
- Dynamic ECharts options
- Lazy rendering via v-for
- Responsive SVG charts with ECharts autoresize
- Minimal DOM re-renders

## Accessibility

✅ **Features**:
- Semantic HTML structure
- ARIA labels on charts
- Color + text indicators (not color-only)
- Keyboard navigable tables
- RTL text direction support

## Browser Support

✅ Modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## TypeScript Interfaces

All data types are strictly typed:

```typescript
// Main data type
ESGDashboardData

// Component props
ESGDashboardProps

// Individual types
ESGKpi
ESGDomain
ESGSummary
ESGSectionData
ESGChartsData
FrameworkCoverage
```

## Common Issues & Troubleshooting

### Charts Not Rendering
- Ensure `v-chart` component is properly imported
- Check that ECharts 6.1+ is installed
- Verify chart options are properly formatted

### RTL Not Working
- Ensure i18n locale is set to 'fa' for Persian
- Component automatically detects RTL from i18n locale
- Use `:dir` attribute binding

### Data Not Displaying
- Verify JSON structure matches `ESGDashboardData` interface
- Check all required fields are present in API response
- Console should show any TypeScript errors

## Customization

### Modify Colors
Edit the color functions in the component:
```typescript
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#0F6E56'; // Modify threshold/color
  // ...
}
```

### Add New Sections
Simply add new data structures in `ESGDashboardData` and update section type:
```typescript
section: 'governance' | 'social' | 'environmental' | 'custom'
```

### Extend Chart Options
Modify chart option objects in computed properties to add more customization.

## Future Enhancements

- Time-series trend charts (if historical data available)
- Targets/benchmarks with RAG status
- Approval workflow indicators
- Export to PDF/Excel
- Filtering & advanced search
- Comparison across periods
- Department/unit breakdown

## License

Part of Shahr Bank Admin Panel

## Support

For issues or questions about the ESG Dashboard component, refer to the sample JSON data structure in `docs/prompt/sample_json_dashboard.json`.
