# ESG Dashboard - Quick Reference Guide

## 🚀 Quick Start

### 1. Import Component
```typescript
import ESGDashboard from '@/components/ESGDashboard.vue';
import type { ESGDashboardData } from '@/types/esg-dashboard.interface';
```

### 2. Use in Template
```html
<ESGDashboard 
  :section="'governance'" 
  :dashboardData="data"
  reportingPeriod="2024 Annual"
/>
```

### 3. Minimal Example
```vue
<template>
  <ESGDashboard :section="section" :dashboardData="dashboardData" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ESGDashboard from '@/components/ESGDashboard.vue';
import type { ESGDashboardData } from '@/types/esg-dashboard.interface';

const section = ref<'governance' | 'social' | 'environmental'>('governance');
const dashboardData = ref<ESGDashboardData>();

onMounted(async () => {
  const res = await fetch('/api/esg-dashboard');
  dashboardData.value = (await res.json()).data;
});
</script>
```

## 📊 What You Get

| Feature | Description |
|---------|-------------|
| **Header** | Section title, KPI count, domains, last updated |
| **KPI Summary Cards** | Total, Answered, Unanswered, Avg Score (4 cards) |
| **Heatmap** | All KPIs with color-coded performance |
| **6 Charts** | Radar, Donut, Pie, 2x Bar Charts, Framework Coverage |
| **Data Table** | Complete KPI list with sorting/filtering |
| **Domain Cards** | 6 KPIs per domain with visual bars |
| **Responsive** | Mobile, Tablet, Desktop optimized |
| **i18n** | English & Persian support |
| **RTL** | Bi-directional text support |

## 🎨 Section Colors

```
✅ Green  (#1D9E75) - Performance ≥80%
⚠️  Amber  (#854F0B) - Performance 50-79%
❌ Red    (#A32D2D) - Performance <50%
ℹ️  Blue   (#378ADD) - Percentage data
🟣 Purple (#534AB7) - Count data
💰 Orange (#D85A30) - Currency data
```

## 📋 Component Props

```typescript
interface ESGDashboardProps {
  section: 'governance' | 'social' | 'environmental';  // Required
  dashboardData: ESGDashboardData;                     // Required
  reportingPeriod?: string;                            // Optional
}
```

## 🔄 Switch Between Sections

```vue
<div class="flex gap-2 mb-6">
  <button 
    v-for="sec in ['governance', 'social', 'environmental']"
    :key="sec"
    @click="activeSection = sec"
    :class="{ 'font-bold': activeSection === sec }"
  >
    {{ sec }}
  </button>
</div>

<ESGDashboard :section="activeSection" :dashboardData="data" />
```

## 📦 Expected API Response Structure

```json
{
  "result": true,
  "data": {
    "reporting_period": "2024 Annual",
    "last_updated": "2026-05-30",
    "governance": {
      "summary": {
        "total_kpis": 72,
        "answered": 71,
        "unanswered": 1,
        "completion": 98.6,
        "avg_score": 81.4
      },
      "domains": [],
      "all_kpis": [],
      "framework_coverage": [],
      "charts": {},
      "detailed_sections": []
    },
    "social": {},
    "environmental": {}
  }
}
```

## 🎯 Key Computations

| Metric | Logic |
|--------|-------|
| **Heatmap Color** | `value ≥80%` → Green, `50-79%` → Amber, `<50%` → Red |
| **Completion %** | `(answered / total) × 100` |
| **Avg Score** | Average of all percentage-type KPI values |
| **Answer Types** | Count: percentage, number, currency, person |
| **Radar Values** | Average KPI score per domain |

## 🌍 i18n Keys

```typescript
esg.governance        // 'ESG Governance'
esg.social           // 'ESG Social'
esg.environmental    // 'ESG Environmental'
esg.totalKpis        // 'Total KPIs tracked'
esg.answered         // 'Answered'
esg.unanswered       // 'Unanswered'
esg.avgScore         // 'Average score'
esg.heatmap          // 'Complete KPI heatmap'
esg.radarChart       // 'Domain radar'
esg.answerStatus     // 'Answer status'
esg.allKpisTable     // 'All KPIs'
// ... and 20+ more
```

## 🛠️ Customization Examples

### Change Heatmap Thresholds
```typescript
// In ESGDashboard.vue, modify getScoreColor()
if (score >= 90) return '#0F6E56';  // New threshold
if (score >= 60) return '#854F0B';
return '#A32D2D';
```

### Modify Chart Colors
```typescript
// In chart options (radarChartOption, etc.)
areaStyle: { color: 'rgba(29, 158, 117, 0.3)' }  // Change transparency/color
lineStyle: { color: '#1D9E75' }                   // Change line color
```

### Add Custom Badges
```vue
<span v-if="sectionData.summary.completion > 95" class="badge badge-ok">
  Excellent Coverage
</span>
```

## 📱 Responsive Breakpoints

```css
Desktop (lg ≥1024px)  → 4-col cards, 2-col charts
Tablet (md 768-1023px) → 2-col cards, 1-col charts
Mobile (<768px)       → 1-col cards, 1-col charts
```

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| Charts not showing | Check ECharts installed, verify data structure |
| RTL not working | Set i18n locale to `fa`, check `:dir` binding |
| Data not displaying | Verify all required fields in API response |
| Build errors | Run `npm install` to ensure dependencies installed |

## 💡 Tips & Tricks

1. **Preload data** - Fetch dashboard data early in your layout/route
2. **Cache results** - Store in Pinia/Vuex to avoid repeated API calls
3. **Error handling** - Wrap fetch in try-catch, show loading state
4. **Add tabs** - Use native tabs to switch between sections smoothly
5. **Export data** - Use html2pdf or xlsx library to export dashboard

## 🎬 Live Demo Data

Use sample data from `docs/prompt/sample_json_dashboard.json` for testing:

```typescript
import sampleData from '@/docs/prompt/sample_json_dashboard.json';

// Use in dev/demo
dashboardData.value = sampleData.data;
```

## 🚦 Build & Deploy

```bash
# Development
npm run dev

# Build for production
npm run build

# Both built successfully with no errors ✅
```

## 📚 Documentation Files

- **Main Implementation**: `ESG_DASHBOARD_IMPLEMENTATION.md`
- **TypeScript Interfaces**: `src/types/esg-dashboard.interface.ts`
- **Component Code**: `src/components/ESGDashboard.vue`
- **Sample Data**: `docs/prompt/sample_json_dashboard.json`
- **Template Inspiration**: `docs/prompt/esg_governance_honest_dashboard.html`

## 🎓 Component Internals

- **Vue 3 Composition API** with `<script setup>`
- **TypeScript** for full type safety
- **Apache ECharts** for visualizations
- **Tailwind CSS** for responsive styling
- **vue-i18n** for translations
- **Computed properties** for optimal reactivity

## ✅ Quality Assurance

- ✅ Type-safe (TypeScript)
- ✅ Accessible (ARIA labels, semantic HTML)
- ✅ Responsive (mobile-first design)
- ✅ Internationalized (en/fa)
- ✅ RTL-ready
- ✅ Production-optimized
- ✅ Build-verified
- ✅ Well-documented

---

**Status**: Ready for Production 🚀

This component is complete, tested, and ready to integrate into the admin panel.
