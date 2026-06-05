<template>
  <div class="ghg-detail" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Narrative Section -->
    <div class="narrative-section">
      <h2 class="narrative-title">
        {{ narrativeData?.title || $t('environmental.ghg.detailTitle') || 'انتشار گازهای گلخانه‌ای' }}
      </h2>
      <p v-if="narrativeData?.body" class="narrative-body">
        {{ interpolateNarrative(narrativeData.body) }}
      </p>
      <p v-else class="narrative-empty">
        {{ $t('environmental.ghg.noNarrative') || 'No narrative available' }}
      </p>
    </div>

    <!-- Scope Breakdown Cards -->
    <div v-if="ghgData" class="scope-cards-section">
      <div class="scope-cards-grid">
        <div class="scope-card scope-1">
          <div class="scope-header">
            <span class="scope-label">{{ $t('ghg.scope1Label') || 'Scope 1' }}</span>
            <span class="scope-subtitle">{{ $t('ghg.directEmissions') || 'Direct Emissions' }}</span>
          </div>
          <div class="scope-value">{{ formatNumber(ghgData.scope_1) }}</div>
          <div class="scope-unit">{{ $t('ghg.unit') || 'tonnes CO₂e' }}</div>
        </div>

        <div class="scope-card scope-2">
          <div class="scope-header">
            <span class="scope-label">{{ $t('ghg.scope2Label') || 'Scope 2' }}</span>
            <span class="scope-subtitle">{{ $t('ghg.indirectEnergy') || 'Indirect Energy' }}</span>
          </div>
          <div class="scope-value">{{ formatNumber(ghgData.scope_2) }}</div>
          <div class="scope-unit">{{ $t('ghg.unit') || 'tonnes CO₂e' }}</div>
        </div>

        <div class="scope-card scope-3">
          <div class="scope-header">
            <span class="scope-label">{{ $t('ghg.scope3Label') || 'Scope 3' }}</span>
            <span class="scope-subtitle">{{ $t('ghg.otherIndirect') || 'Other Indirect' }}</span>
          </div>
          <div class="scope-value">{{ formatNumber(ghgData.scope_3) }}</div>
          <div class="scope-unit">{{ $t('ghg.unit') || 'tonnes CO₂e' }}</div>
        </div>

        <div class="scope-card scope-total">
          <div class="scope-header">
            <span class="scope-label">{{ $t('ghg.totalLabel') || 'Total' }}</span>
            <span class="scope-subtitle">{{ $t('ghg.totalEmissions') || 'Total Emissions' }}</span>
          </div>
          <div class="scope-value total">{{ formatNumber(ghgData.total) }}</div>
          <div class="scope-unit">{{ $t('ghg.unit') || 'tonnes CO₂e' }}</div>
        </div>
      </div>
    </div>

    <!-- Visualizations Section -->
    <div v-if="ghgData" class="visualizations-section">
      <div class="visualizations-grid">
        <!-- Scope Distribution Pie Chart -->
        <div class="viz-card pie-chart-card">
          <h3 class="viz-title">{{ $t('ghg.distributionTitle') || 'Scope Distribution' }}</h3>
          <div class="pie-chart-container">
            <svg viewBox="0 0 120 120" class="pie-svg">
              <!-- Scope 1 segment -->
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none"
                stroke="#10B981"
                stroke-width="15"
                stroke-dasharray="0, 339.29"
                stroke-linecap="round"
                class="pie-segment scope-1-segment"
              />
              <!-- Scope 2 segment -->
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none"
                stroke="#3B82F6"
                stroke-width="15"
                stroke-linecap="round"
                class="pie-segment scope-2-segment"
                :style="{ strokeDasharray: `${scope2DashArray}, 339.29` }"
              />
              <!-- Scope 3 segment -->
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none"
                stroke="#F59E0B"
                stroke-width="15"
                stroke-linecap="round"
                class="pie-segment scope-3-segment"
                :style="{ strokeDasharray: `${scope3DashArray}, 339.29` }"
              />
            </svg>
            <div class="pie-legend">
              <div class="legend-item">
                <span class="legend-color scope-1"></span>
                <span class="legend-text">{{ $t('ghg.scope1Label') || 'Scope 1' }}: {{ scopePercentages.scope1 }}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-color scope-2"></span>
                <span class="legend-text">{{ $t('ghg.scope2Label') || 'Scope 2' }}: {{ scopePercentages.scope2 }}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-color scope-3"></span>
                <span class="legend-text">{{ $t('ghg.scope3Label') || 'Scope 3' }}: {{ scopePercentages.scope3 }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Reduction Progress Bar -->
        <div v-if="ghgData.reduction_progress !== undefined" class="viz-card progress-card">
          <h3 class="viz-title">{{ $t('ghg.reductionTitle') || 'Reduction Progress' }}</h3>
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${ghgData.reduction_progress}%` }"
              ></div>
            </div>
            <div class="progress-info">
              <span class="progress-value">{{ Math.round(ghgData.reduction_progress) }}%</span>
              <span class="progress-label">{{ $t('ghg.reductionLabel') || 'towards target' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls List Section -->
    <div v-if="groupedControls.length > 0" class="controls-section">
      <h3 class="section-title">{{ $t('ghg.controlsTitle') || 'GHG Controls' }}</h3>
      
      <div v-for="group in groupedControls" :key="group.scope" class="control-group">
        <div class="group-header">
          <span class="scope-badge" :class="`scope-${group.scope}`">{{ group.scope }}</span>
          <span class="group-count">{{ group.controls.length }} {{ $t('ghg.item') || 'item' }}</span>
        </div>
        
        <div class="controls-list">
          <div v-for="(control, idx) in group.controls" :key="`${group.scope}-${idx}`" class="control-item">
            <div class="control-content">
              <div class="control-title">{{ control.title }}</div>
              <div class="control-answer">
                <span class="answer-value">{{ control.answer }}</span>
                <span v-if="control.unit" class="answer-unit">{{ control.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table Section -->
    <div v-if="ghgControls.length > 0" class="table-section">
      <h3 class="section-title">{{ $t('ghg.tableTitle') || 'Complete GHG Controls' }}</h3>
      
      <div class="table-wrapper">
        <table class="ghg-table">
          <thead>
            <tr>
              <th>{{ $t('ghg.titleCol') || 'Title' }}</th>
              <th>{{ $t('ghg.scopeCol') || 'Scope' }}</th>
              <th>{{ $t('ghg.answerCol') || 'Value' }}</th>
              <th>{{ $t('ghg.unitCol') || 'Unit' }}</th>
              <th v-if="hasFrameworks">{{ $t('ghg.frameworksCol') || 'Frameworks' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(control, idx) in ghgControls" :key="idx">
              <td class="col-title">{{ control.title }}</td>
              <td class="col-scope">
                <span class="scope-badge" :class="`scope-${control.scope || 'unknown'}`">
                  {{ control.scope || '—' }}
                </span>
              </td>
              <td class="col-answer">{{ control.answer }}</td>
              <td class="col-unit">{{ control.unit || '—' }}</td>
              <td v-if="hasFrameworks" class="col-frameworks">
                <span v-if="control.frameworks && control.frameworks.length > 0" class="framework-badges">
                  <span v-for="fw in control.frameworks" :key="fw" class="framework-badge">
                    {{ fw }}
                  </span>
                </span>
                <span v-else>—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { NarrativeSection, ControlData } from '@/core/services/reportService'

interface GHGData {
  scope_1: number
  scope_2: number
  scope_3: number
  total: number
  reduction_progress?: number
}

const props = defineProps<{
  narrativeData?: NarrativeSection
  ghgControls: ControlData[]
}>()

const { t: $t, locale } = useI18n()

const isRTL = computed(() => locale.value === 'fa')

// Extract GHG data from narrative or compute from controls
const ghgData = computed((): GHGData | null => {
  if (!props.narrativeData?.metadata) return null
  
  const meta = props.narrativeData.metadata as any
  return {
    scope_1: meta.scope_1 || 0,
    scope_2: meta.scope_2 || 0,
    scope_3: meta.scope_3 || 0,
    total: meta.total || (meta.scope_1 || 0) + (meta.scope_2 || 0) + (meta.scope_3 || 0),
    reduction_progress: meta.reduction_progress
  }
})

// Scope percentages for pie chart
const scopePercentages = computed(() => {
  if (!ghgData.value || ghgData.value.total === 0) {
    return { scope1: 0, scope2: 0, scope3: 0 }
  }
  
  return {
    scope1: Math.round((ghgData.value.scope_1 / ghgData.value.total) * 100),
    scope2: Math.round((ghgData.value.scope_2 / ghgData.value.total) * 100),
    scope3: Math.round((ghgData.value.scope_3 / ghgData.value.total) * 100)
  }
})

// Calculate pie chart segments
const scope2DashArray = computed(() => {
  if (!ghgData.value || ghgData.value.total === 0) return '0'
  const percentage = (ghgData.value.scope_2 / ghgData.value.total) * 100
  return ((percentage / 100) * 339.29).toFixed(2)
})

const scope3DashArray = computed(() => {
  if (!ghgData.value || ghgData.value.total === 0) return '0'
  const scope1Pct = (ghgData.value.scope_1 / ghgData.value.total) * 100
  const scope2Pct = (ghgData.value.scope_2 / ghgData.value.total) * 100
  const offset = ((scope1Pct + scope2Pct) / 100) * 339.29
  const scope3Pct = (ghgData.value.scope_3 / ghgData.value.total) * 100
  const length = ((scope3Pct / 100) * 339.29)
  return `${length}, ${339.29 - offset - length}`
})

// Group controls by scope
const groupedControls = computed(() => {
  if (props.ghgControls.length === 0) return []
  
  const groups: Record<string, { scope: string; controls: ControlData[] }> = {}
  const scopes = ['Scope 1', 'Scope 2', 'Scope 3', 'Other']
  
  scopes.forEach(scope => {
    groups[scope] = { scope, controls: [] }
  })
  
  props.ghgControls.forEach(control => {
    const scope = control.scope || 'Other'
    if (!groups[scope]) {
      groups[scope] = { scope, controls: [] }
    }
    groups[scope].controls.push(control)
  })
  
  return Object.values(groups).filter(g => g.controls.length > 0)
})

// Check if there are frameworks to display
const hasFrameworks = computed(() => {
  return props.ghgControls.some(c => c.frameworks && c.frameworks.length > 0)
})

// Helper: Format number with thousands separator
function formatNumber(value?: number): string {
  if (value === undefined || value === null) return '0'
  return new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US').format(value)
}

// Helper: Interpolate narrative placeholders with actual values
function interpolateNarrative(text: string): string {
  if (!ghgData.value) return text
  
  let result = text
  result = result.replace(/{scope_1}/g, formatNumber(ghgData.value.scope_1))
  result = result.replace(/{scope_2}/g, formatNumber(ghgData.value.scope_2))
  result = result.replace(/{scope_3}/g, formatNumber(ghgData.value.scope_3))
  result = result.replace(/{total}/g, formatNumber(ghgData.value.total))
  result = result.replace(/{reduction_progress}/g, 
    ghgData.value.reduction_progress !== undefined 
      ? `${Math.round(ghgData.value.reduction_progress)}%` 
      : 'N/A'
  )
  
  return result
}
</script>

<style scoped lang="postcss">
.ghg-detail {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 0;
  
  @apply text-slate-800;
}

/* Narrative Section */
.narrative-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
  border-radius: 0.75rem;
  border-left: 4px solid #10b981;
  
  @apply dark:bg-slate-800/50;
}

.narrative-title {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.4;
  
  @apply text-slate-900 dark:text-white;
}

.narrative-body {
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  
  @apply text-slate-700 dark:text-slate-300;
}

.narrative-empty {
  font-size: 0.875rem;
  font-style: italic;
  
  @apply text-slate-500 dark:text-slate-400;
}

/* Scope Cards Section */
.scope-cards-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.scope-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.scope-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border-top: 3px solid;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  
  @apply dark:bg-slate-700;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  }
  
  &.scope-1 {
    border-top-color: #10b981;
  }
  
  &.scope-2 {
    border-top-color: #3b82f6;
  }
  
  &.scope-3 {
    border-top-color: #f59e0b;
  }
  
  &.scope-total {
    border-top-color: #8b5cf6;
    grid-column: span 1;
  }
}

.scope-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.scope-label {
  font-size: 1rem;
  font-weight: 600;
  
  @apply text-slate-900 dark:text-white;
}

.scope-subtitle {
  font-size: 0.75rem;
  
  @apply text-slate-500 dark:text-slate-400;
}

.scope-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
  
  @apply text-slate-900 dark:text-white;
  
  &.total {
    font-size: 2.5rem;
    color: #8b5cf6;
  }
}

.scope-unit {
  font-size: 0.875rem;
  
  @apply text-slate-600 dark:text-slate-400;
}

/* Visualizations Section */
.visualizations-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.visualizations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.viz-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @apply dark:bg-slate-700;
}

.viz-title {
  font-size: 1.125rem;
  font-weight: 600;
  
  @apply text-slate-900 dark:text-white;
}

/* Pie Chart Card */
.pie-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.pie-svg {
  width: 200px;
  height: 200px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.pie-segment {
  transform-origin: 60px 60px;
  stroke-dashoffset: 0;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  
  @apply text-slate-700 dark:text-slate-300;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  
  &.scope-1 { background-color: #10b981; }
  &.scope-2 { background-color: #3b82f6; }
  &.scope-3 { background-color: #f59e0b; }
}

.legend-text {
  flex: 1;
}

/* Progress Card */
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  
  @apply dark:bg-slate-600;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.progress-value {
  font-weight: 600;
  font-size: 1.125rem;
  
  @apply text-slate-900 dark:text-white;
}

.progress-label {
  @apply text-slate-600 dark:text-slate-400;
}

/* Controls Section */
.controls-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  
  @apply text-slate-900 dark:text-white dark:border-slate-600;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  
  @apply dark:bg-slate-800/50;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  
  @apply dark:border-slate-600;
}

.scope-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: uppercase;
  
  &.scope-Scope\ 1,
  &.scope-scope_1,
  &.scope-1 {
    background-color: #d1fae5;
    color: #065f46;
    
    @apply dark:bg-green-900/30 dark:text-green-300;
  }
  
  &.scope-Scope\ 2,
  &.scope-scope_2,
  &.scope-2 {
    background-color: #dbeafe;
    color: #1e40af;
    
    @apply dark:bg-blue-900/30 dark:text-blue-300;
  }
  
  &.scope-Scope\ 3,
  &.scope-scope_3,
  &.scope-3 {
    background-color: #fef3c7;
    color: #92400e;
    
    @apply dark:bg-amber-900/30 dark:text-amber-300;
  }
}

.group-count {
  font-size: 0.75rem;
  font-weight: 500;
  
  @apply text-slate-600 dark:text-slate-400;
}

.controls-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  border-left: 2px solid #e5e7eb;
  
  @apply dark:bg-slate-700 dark:border-slate-600;
}

.control-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.control-title {
  font-size: 0.875rem;
  font-weight: 500;
  
  @apply text-slate-900 dark:text-white;
}

.control-answer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.answer-value {
  font-weight: 600;
  
  @apply text-slate-700 dark:text-slate-300;
}

.answer-unit {
  @apply text-slate-600 dark:text-slate-400;
}

/* Table Section */
.table-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @apply dark:shadow-none;
}

.ghg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  background: white;
  
  @apply dark:bg-slate-700;
  
  thead {
    background: #f3f4f6;
    
    @apply dark:bg-slate-800;
    
    th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
      
      @apply text-slate-900 dark:text-white dark:border-slate-600;
    }
  }
  
  tbody tr {
    border-bottom: 1px solid #e5e7eb;
    transition: background 0.2s;
    
    @apply dark:border-slate-600;
    
    &:hover {
      background: #f9fafb;
      
      @apply dark:bg-slate-600/50;
    }
  }
  
  td {
    padding: 1rem;
    
    @apply text-slate-700 dark:text-slate-300;
  }
}

.col-title {
  font-weight: 500;
  
  @apply text-slate-900 dark:text-white;
}

.col-scope {
  text-align: center;
}

.col-answer {
  font-weight: 500;
  
  @apply text-slate-900 dark:text-white;
}

.col-unit {
  @apply text-slate-600 dark:text-slate-400;
}

.col-frameworks {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.framework-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.framework-badge {
  display: inline-flex;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
  border-radius: 0.25rem;
  
  @apply dark:bg-slate-600 dark:text-slate-300;
}

/* RTL Support */
[dir='rtl'] {
  .narrative-section {
    border-left: none;
    border-right: 4px solid #10b981;
  }
  
  .control-item {
    border-left: none;
    border-right: 2px solid #e5e7eb;
    
    @apply dark:border-slate-600;
  }
  
  .legend-item {
    flex-direction: row-reverse;
  }
  
  .progress-info {
    flex-direction: row-reverse;
  }
  
  .group-header {
    flex-direction: row-reverse;
  }
  
  .col-scope {
    text-align: center;
  }
}

/* Dark Mode Adjustments */
@media (prefers-color-scheme: dark) {
  .narrative-section {
    background: linear-gradient(135deg, #064e3b 0%, #1e3a8a 100%);
    border-right-color: #10b981;
  }
}
</style>
