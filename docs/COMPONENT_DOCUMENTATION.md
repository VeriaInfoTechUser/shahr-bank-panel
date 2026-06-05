# Component Documentation

## TabNavigation Component

**Location:** `src/components/utils/TabNavigation.vue`

**Purpose:** Reusable tab switcher with keyboard navigation, RTL support, and responsive design.

### Props

```typescript
interface Props {
  modelValue: number // Active tab index
  tabs: Array<{
    id: string
    label: string
    icon?: string
    disabled?: boolean
    badge?: number | string
  }>
  vertical?: boolean // Stack tabs vertically
  animated?: boolean // Smooth transitions (default: true)
}
```

### Events

```typescript
emit('update:modelValue', tabIndex: number)
emit('change', tabIndex: number)
```

### Usage

```vue
<template>
  <div>
    <TabNavigation 
      v-model="activeTab"
      :tabs="tabs"
      animated
    >
      <template #tab-label="{ tab }">
        {{ $t(tab.label) }}
      </template>
    </TabNavigation>

    <div class="tab-content">
      <component :is="tabContent[activeTab]" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TabNavigation from '@/components/utils/TabNavigation.vue'

const activeTab = ref(0)
const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'environmental', label: 'Environmental' },
  { id: 'social', label: 'Social' },
]
</script>
```

### Keyboard Navigation

- **Tab**: Move to next tab
- **Shift+Tab**: Move to previous tab
- **Arrow Right**: Next tab (LTR)
- **Arrow Left**: Previous tab (LTR)
- **Enter/Space**: Activate tab
- **Home**: First tab
- **End**: Last tab

### Accessibility

- ✅ ARIA labels on each tab
- ✅ Focus indicators visible
- ✅ Keyboard navigation
- ✅ Screen reader announcements
- ✅ RTL-aware arrow key handling

---

## DataTable Component

**Location:** `src/components/utils/DataTable.vue`

**Purpose:** Sortable, filterable, searchable table with responsive card view on mobile.

### Props

```typescript
interface Column {
  key: string
  label: string
  sortable?: boolean
  filterable?: boolean
  format?: (value: any) => string
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: Column[]
  data: any[]
  sortable?: boolean // Default: true
  searchable?: boolean // Default: true
  filterable?: boolean // Default: true
  framework?: string // Filter by framework
  perPage?: number // Default: 25
  responsive?: boolean // Default: true
  loading?: boolean
  empty?: string
}
```

### Events

```typescript
emit('row-click', row: any)
emit('sort', { key: string, direction: 'asc' | 'desc' })
emit('search', query: string)
```

### Usage

```vue
<template>
  <DataTable
    :columns="columns"
    :data="controls"
    :framework="selectedFramework"
    :loading="loading"
    searchable
    sortable
    @row-click="handleRowClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataTable from '@/components/utils/DataTable.vue'

const columns = [
  { key: 'title', label: 'Title', sortable: true },
  { key: 'value', label: 'Value', sortable: true, format: (v) => `${v.toFixed(2)}` },
  { key: 'unit', label: 'Unit' },
  { key: 'framework', label: 'Framework', filterable: true },
]

const controls = [
  { title: 'Control 1', value: 100, unit: 'kg', framework: 'GRI' },
]

const handleRowClick = (row) => {
  console.log('Row clicked:', row)
}
</script>
```

### Features

- ✅ Multi-column sort
- ✅ Live search across all fields
- ✅ Framework filter dropdown
- ✅ Responsive table/card toggle
- ✅ Pagination
- ✅ Empty state
- ✅ Loading state
- ✅ Keyboard navigation

---

## MetricCard Component

**Location:** `src/components/utils/MetricCard.vue`

**Purpose:** Display single metric with title, value, unit, and optional trend indicator.

### Props

```typescript
interface Props {
  title: string
  value: number | string
  unit?: string
  icon?: string
  trendValue?: number // +5 or -3
  trendLabel?: string
  colorRange?: {
    min: number
    low: number
    medium: number
    high: number
  }
  format?: (value: number) => string
}
```

### Usage

```vue
<template>
  <div class="metrics-grid">
    <MetricCard
      title="کل انتشار"
      :value="250000"
      unit="tonnes CO2e"
      :trend-value="-5"
      trend-label="vs 2022"
      :color-range="{
        min: 0,
        low: 100000,
        medium: 200000,
        high: 300000
      }"
    />
  </div>
</template>

<script setup lang="ts">
import MetricCard from '@/components/utils/MetricCard.vue'
</script>
```

### Color Coding

- **Green (#27AE60)**: Value in top 25%
- **Yellow (#F39C12)**: Value in middle 50%
- **Red (#E74C3C)**: Value in bottom 25%

---

## NarrativeCard Component

**Location:** `src/components/utils/NarrativeCard.vue`

**Purpose:** Display narrative text with RTL auto-detection and number highlighting.

### Props

```typescript
interface Props {
  title: string
  body: string
  highlightNumbers?: boolean // Default: true
}
```

### Usage

```vue
<template>
  <NarrativeCard
    :title="narrative.title"
    :body="narrative.body"
    highlight-numbers
  />
</template>

<script setup lang="ts">
import NarrativeCard from '@/components/utils/NarrativeCard.vue'
import { reportData } from '@/stores/report'

const narrative = reportData.narratives.environmental
</script>
```

### Features

- ✅ Auto RTL detection
- ✅ Number syntax highlighting
- ✅ Markdown support
- ✅ Responsive typography
- ✅ Print-friendly

---

## ChartContainer Component

**Location:** `src/components/utils/ChartContainer.vue`

**Purpose:** Responsive wrapper for SVG charts with empty state handling.

### Props

```typescript
interface Props {
  title?: string
  data?: any[]
  loading?: boolean
  error?: string
  empty?: string
  height?: number | string // Default: 300px
  responsive?: boolean // Default: true
}
```

### Usage

```vue
<template>
  <ChartContainer
    title="Emissions by Scope"
    :data="scopeData"
    :loading="isLoading"
    height="400px"
  >
    <svg class="scope-chart" :viewBox="`0 0 300 300`">
      <!-- SVG content -->
    </svg>
  </ChartContainer>
</template>

<script setup lang="ts">
import ChartContainer from '@/components/utils/ChartContainer.vue'
</script>
```

### Features

- ✅ Responsive sizing
- ✅ Loading skeleton
- ✅ Empty state message
- ✅ Error display
- ✅ Maintains aspect ratio

---

## ErrorBoundary Component

**Location:** `src/components/ErrorBoundary.vue`

**Purpose:** Catch component errors and show fallback UI with retry option.

### Usage

```vue
<template>
  <ErrorBoundary @error="handleError">
    <ReportContainer />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import ErrorBoundary from '@/components/ErrorBoundary.vue'

const handleError = (error: Error) => {
  console.error('Component error:', error)
}
</script>
```

### Features

- ✅ Catches Vue errors
- ✅ Retry button
- ✅ Development error stack
- ✅ Error reporting
- ✅ Dark mode support
- ✅ Accessible error messages

---

## ThemeProvider Component

**Location:** `src/components/ThemeProvider.vue`

**Purpose:** Manage application theme with system preference detection.

### Props

```typescript
interface Props {
  initialTheme?: 'light' | 'dark' | 'auto' // Default: 'auto'
  showToggle?: boolean // Default: false
  storageKey?: string // Default: 'app-theme'
}
```

### Events

```typescript
emit('theme-change', theme: 'light' | 'dark')
```

### Usage

```vue
<template>
  <ThemeProvider 
    initial-theme="auto"
    :show-toggle="true"
    @theme-change="onThemeChange"
  >
    <div id="app">
      <RouterView />
    </div>
  </ThemeProvider>
</template>

<script setup lang="ts">
import ThemeProvider from '@/components/ThemeProvider.vue'

const onThemeChange = (theme: 'light' | 'dark') => {
  console.log('Theme changed to:', theme)
}
</script>
```

### Features

- ✅ Auto-detect system preference
- ✅ localStorage persistence
- ✅ Floating toggle button (optional)
- ✅ CSS variable switching
- ✅ Dark mode ready

---

## Using Accessibility Utilities

### Add ARIA Labels

```typescript
import { buildAriaLabel, getValueDescription } from '@/utils/accessibility'

const ariaLabel = buildAriaLabel(['Row 1', 'Column Emissions', 'GRI'])
// Result: "Row 1, Column Emissions, GRI"

const description = getValueDescription(250000, 'tonnes', 'of CO2e')
// Result: "250,000 tonnes of CO2e"
```

### Check Color Contrast

```typescript
import { checkContrast } from '@/utils/accessibility'

const result = checkContrast('#FFFFFF', '#2C5AA0')
// { ratio: 4.48, passAA: true, passAAA: false }
```

### Announce to Screen Readers

```typescript
import { announceToScreenReader } from '@/utils/accessibility'

announceToScreenReader('Report data loaded successfully')
```

---

## Performance Utilities

### Lazy Load Images

```typescript
import { LazyImageLoader } from '@/utils/performance'

const lazyLoader = new LazyImageLoader()

// In template: <img data-src="image.png" />
document.querySelectorAll('[data-src]').forEach(el => {
  lazyLoader.observe(el)
})
```

### Debounce Resize

```typescript
import { ResponsiveObserver } from '@/utils/performance'

const observer = new ResponsiveObserver((entries) => {
  entries.forEach(entry => {
    console.log('Resized:', entry.contentRect)
  })
}, 250)

observer.observe(container)
```

### Virtual Scrolling

```typescript
import { VirtualScroller } from '@/utils/performance'

const scroller = new VirtualScroller({
  itemHeight: 50,
  visibleCount: 20,
  totalCount: 10000,
})

// On scroll
const range = scroller.getVisibleRange(scrollTop)
renderItems(range.visibleItems)
```

---

## Best Practices

### Component Organization

```
components/
├── ReportContainer.vue          # Main container
├── ReportConclusion.vue         # Export section
├── sections/
│   ├── EnvironmentalSection.vue
│   ├── SocialSection.vue
│   ├── GovernanceSection.vue
│   ├── env/
│   │   ├── GHGDetail.vue
│   │   ├── EnergyDetail.vue
│   │   └── ...
│   └── social/
│       └── ...
└── utils/
    ├── DataTable.vue
    ├── TabNavigation.vue
    ├── MetricCard.vue
    ├── NarrativeCard.vue
    └── ChartContainer.vue
```

### Type Safety

Always define component props with TypeScript:

```typescript
interface Props {
  data: ReportData
  loading?: boolean
  error?: Error | null
}

withDefaults(defineProps<Props>(), {
  loading: false,
})
```

### Reactivity

Use `ref` for component state, `computed` for derived values:

```typescript
const activeTab = ref(0)
const tabContent = computed(() => sections[activeTab.value])
```

### Error Handling

Always wrap async operations in try-catch:

```typescript
try {
  const data = await fetchReport()
} catch (error) {
  logError(error)
  showUserMessage('Failed to load report')
}
```

---

## Testing Components

### Snapshot Test

```typescript
import { mount } from '@vue/test-utils'
import MetricCard from '@/components/utils/MetricCard.vue'

it('renders metric card correctly', () => {
  const wrapper = mount(MetricCard, {
    props: {
      title: 'Test',
      value: 100,
      unit: 'kg',
    },
  })
  expect(wrapper.html()).toMatchSnapshot()
})
```

### Props Test

```typescript
it('displays correct value with format', () => {
  const wrapper = mount(MetricCard, {
    props: {
      value: 1000,
      format: (v) => `${v / 1000}K`,
    },
  })
  expect(wrapper.text()).toContain('1K')
})
```

---

## Performance Checklist

- [ ] Use `v-if` for large conditional sections
- [ ] Lazy load images with `data-src`
- [ ] Virtualize tables with 100+ rows
- [ ] Debounce resize/scroll handlers
- [ ] Use CSS modules for component styles
- [ ] Code split sections with dynamic imports
- [ ] Monitor bundle size with `npm run build`
- [ ] Test with React DevTools Profiler

---

For more examples, see `/docs/` and `/src/__tests__/`
