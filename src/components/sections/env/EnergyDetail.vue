<template>
  <div class="energy-detail" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Narrative Section -->
    <div class="narrative-section">
      <h2 class="narrative-title">
        {{ narrativeData?.title || $t('environmental.energy.detailTitle') || 'مدیریت انرژی' }}
      </h2>
      <p v-if="narrativeData?.body" class="narrative-body">
        {{ interpolateNarrative(narrativeData.body) }}
      </p>
      <p v-else class="narrative-empty">
        {{ $t('environmental.energy.noNarrative') || 'No narrative available' }}
      </p>
    </div>

    <!-- Energy KPI Cards -->
    <div v-if="energyData" class="kpi-cards-section">
      <div class="kpi-cards-grid">
        <div class="kpi-card electricity">
          <div class="kpi-header">
            <span class="kpi-icon">⚡</span>
            <span class="kpi-label">{{ $t('energy.electricityLabel') || 'Electricity' }}</span>
          </div>
          <div class="kpi-value">{{ formatNumber(energyData.electricity) }}</div>
          <div class="kpi-unit">{{ $t('energy.electricityUnit') || 'MWh' }}</div>
        </div>

        <div class="kpi-card natural-gas">
          <div class="kpi-header">
            <span class="kpi-icon">🔥</span>
            <span class="kpi-label">{{ $t('energy.gasLabel') || 'Natural Gas' }}</span>
          </div>
          <div class="kpi-value">{{ formatNumber(energyData.natural_gas) }}</div>
          <div class="kpi-unit">{{ $t('energy.gasUnit') || 'm³' }}</div>
        </div>

        <div class="kpi-card liquid-fuel">
          <div class="kpi-header">
            <span class="kpi-icon">🛢️</span>
            <span class="kpi-label">{{ $t('energy.fuelLabel') || 'Liquid Fuel' }}</span>
          </div>
          <div class="kpi-value">{{ formatNumber(energyData.liquid_fuel) }}</div>
          <div class="kpi-unit">{{ $t('energy.fuelUnit') || 'liters' }}</div>
        </div>

        <div class="kpi-card renewable">
          <div class="kpi-header">
            <span class="kpi-icon">☀️</span>
            <span class="kpi-label">{{ $t('energy.renewableLabel') || 'Renewable' }}</span>
          </div>
          <div class="kpi-value">{{ Math.round(energyData.renewable_percentage) }}</div>
          <div class="kpi-unit">{{ $t('energy.renewableUnit') || '%' }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div v-if="energyData" class="charts-section">
      <div class="charts-grid">
        <!-- Stacked Bar Chart -->
        <div class="chart-card stacked-bar-card">
          <h3 class="chart-title">{{ $t('energy.energyMixTitle') || 'Energy Sources Mix' }}</h3>
          <div class="stacked-bar-container">
            <div class="stacked-bar">
              <div 
                class="bar-segment electricity"
                :style="{ width: `${getEnergyPercentage('electricity')}%` }"
                :title="`${getEnergyPercentage('electricity')}%`"
              ></div>
              <div 
                class="bar-segment natural-gas"
                :style="{ width: `${getEnergyPercentage('natural_gas')}%` }"
                :title="`${getEnergyPercentage('natural_gas')}%`"
              ></div>
              <div 
                class="bar-segment liquid-fuel"
                :style="{ width: `${getEnergyPercentage('liquid_fuel')}%` }"
                :title="`${getEnergyPercentage('liquid_fuel')}%`"
              ></div>
            </div>
            <div class="bar-legend">
              <div class="legend-item">
                <span class="legend-color electricity"></span>
                <span class="legend-text">{{ $t('energy.electricityLabel') || 'Electricity' }}: {{ getEnergyPercentage('electricity') }}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-color natural-gas"></span>
                <span class="legend-text">{{ $t('energy.gasLabel') || 'Natural Gas' }}: {{ getEnergyPercentage('natural_gas') }}%</span>
              </div>
              <div class="legend-item">
                <span class="legend-color liquid-fuel"></span>
                <span class="legend-text">{{ $t('energy.fuelLabel') || 'Liquid Fuel' }}: {{ getEnergyPercentage('liquid_fuel') }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Renewable Gauge Chart -->
        <div class="chart-card gauge-card">
          <h3 class="chart-title">{{ $t('energy.renewableTitle') || 'Renewable Percentage' }}</h3>
          <div class="gauge-container">
            <svg viewBox="0 0 120 80" class="gauge-svg">
              <!-- Background arc -->
              <path 
                d="M 20 60 A 40 40 0 0 1 100 60" 
                stroke="#e5e7eb" 
                stroke-width="8" 
                fill="none"
                class="gauge-background"
              />
              <!-- Progress arc -->
              <path 
                :d="getGaugePath(energyData.renewable_percentage)"
                stroke="#10b981"
                stroke-width="8"
                fill="none"
                stroke-linecap="round"
                class="gauge-progress"
              />
            </svg>
            <div class="gauge-center">
              <div class="gauge-value">{{ Math.round(energyData.renewable_percentage) }}%</div>
              <div class="gauge-label">{{ $t('energy.renewable') || 'Renewable' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls List Section -->
    <div v-if="groupedControls.length > 0" class="controls-section">
      <h3 class="section-title">{{ $t('energy.controlsTitle') || 'Energy Controls' }}</h3>
      
      <div v-for="group in groupedControls" :key="group.energy_type" class="control-group">
        <div class="group-header">
          <span class="energy-badge" :class="`energy-${group.energy_type}`">{{ group.energy_type }}</span>
          <span class="group-count">{{ group.controls.length }} {{ $t('energy.item') || 'item' }}</span>
        </div>
        
        <div class="controls-list">
          <div v-for="(control, idx) in group.controls" :key="`${group.energy_type}-${idx}`" class="control-item">
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
    <div v-if="energyControls.length > 0" class="table-section">
      <h3 class="section-title">{{ $t('energy.tableTitle') || 'Complete Energy Controls' }}</h3>
      
      <div class="table-wrapper">
        <table class="energy-table">
          <thead>
            <tr>
              <th>{{ $t('energy.titleCol') || 'Title' }}</th>
              <th>{{ $t('energy.typeCol') || 'Energy Type' }}</th>
              <th>{{ $t('energy.answerCol') || 'Value' }}</th>
              <th>{{ $t('energy.unitCol') || 'Unit' }}</th>
              <th v-if="hasFrameworks">{{ $t('energy.frameworksCol') || 'Frameworks' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(control, idx) in energyControls" :key="idx">
              <td class="col-title">{{ control.title }}</td>
              <td class="col-type">
                <span class="energy-badge" :class="`energy-${control.energy_type || 'other'}`">
                  {{ control.energy_type || '—' }}
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

interface EnergyData {
  electricity: number
  natural_gas: number
  liquid_fuel: number
  renewable_percentage: number
}

const props = defineProps<{
  narrativeData?: NarrativeSection
  energyControls: ControlData[]
}>()

const { t: $t, locale } = useI18n()

const isRTL = computed(() => locale.value === 'fa')

// Extract energy data from narrative metadata
const energyData = computed((): EnergyData | null => {
  if (!props.narrativeData?.metadata) return null
  
  const meta = props.narrativeData.metadata as any
  return {
    electricity: meta.electricity || 0,
    natural_gas: meta.natural_gas || 0,
    liquid_fuel: meta.liquid_fuel || 0,
    renewable_percentage: meta.renewable_percentage || 0
  }
})

// Calculate total energy (normalized to MWh equivalent for comparison)
const totalEnergy = computed(() => {
  if (!energyData.value) return 0
  // Normalize: 1 m³ gas ≈ 0.01 MWh, 1 liter fuel ≈ 0.01 MWh
  return energyData.value.electricity + 
         (energyData.value.natural_gas * 0.01) + 
         (energyData.value.liquid_fuel * 0.01)
})

// Calculate energy source percentages
function getEnergyPercentage(sourceKey: 'electricity' | 'natural_gas' | 'liquid_fuel'): number {
  if (!energyData.value || totalEnergy.value === 0) return 0
  
  let value = 0
  if (sourceKey === 'electricity') {
    value = energyData.value.electricity
  } else if (sourceKey === 'natural_gas') {
    value = energyData.value.natural_gas * 0.01
  } else if (sourceKey === 'liquid_fuel') {
    value = energyData.value.liquid_fuel * 0.01
  }
  
  return Math.round((value / totalEnergy.value) * 100)
}

// Generate gauge SVG path
function getGaugePath(percentage: number): string {
  const normalizedPercentage = Math.min(100, Math.max(0, percentage))
  const angle = (normalizedPercentage / 100) * Math.PI
  
  const startX = 20
  const startY = 60
  const endX = 20 + 80 * Math.cos(angle)
  const endY = 60 - 80 * Math.sin(angle)
  
  const largeArc = normalizedPercentage > 50 ? 1 : 0
  
  return `M ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY}`
}

// Group controls by energy type
const groupedControls = computed(() => {
  if (props.energyControls.length === 0) return []
  
  const groups: Record<string, { energy_type: string; controls: ControlData[] }> = {}
  const types = ['Electricity', 'Natural Gas', 'Liquid Fuel', 'Renewable', 'Other']
  
  types.forEach(type => {
    groups[type] = { energy_type: type, controls: [] }
  })
  
  props.energyControls.forEach(control => {
    const type = control.energy_type || 'Other'
    if (!groups[type]) {
      groups[type] = { energy_type: type, controls: [] }
    }
    groups[type].controls.push(control)
  })
  
  return Object.values(groups).filter(g => g.controls.length > 0)
})

// Check if frameworks exist
const hasFrameworks = computed(() => {
  return props.energyControls.some(c => c.frameworks && c.frameworks.length > 0)
})

// Helper: Format number with thousands separator
function formatNumber(value?: number): string {
  if (value === undefined || value === null) return '0'
  return new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US').format(value)
}

// Helper: Interpolate narrative with dynamic values
function interpolateNarrative(text: string): string {
  if (!energyData.value) return text
  
  let result = text
  result = result.replace(/{electricity}/g, formatNumber(energyData.value.electricity))
  result = result.replace(/{natural_gas}/g, formatNumber(energyData.value.natural_gas))
  result = result.replace(/{liquid_fuel}/g, formatNumber(energyData.value.liquid_fuel))
  result = result.replace(/{renewable_percentage}/g, `${Math.round(energyData.value.renewable_percentage)}%`)
  
  return result
}
</script>

<style scoped lang="postcss">
.energy-detail {
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
  background: linear-gradient(135deg, #fef3c7 0%, #dbeafe 100%);
  border-radius: 0.75rem;
  border-left: 4px solid #f59e0b;
  
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

/* KPI Cards Section */
.kpi-cards-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.kpi-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.kpi-card {
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
  
  &.electricity {
    border-top-color: #3b82f6;
  }
  
  &.natural-gas {
    border-top-color: #f59e0b;
  }
  
  &.liquid-fuel {
    border-top-color: #ef4444;
  }
  
  &.renewable {
    border-top-color: #10b981;
  }
}

.kpi-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.kpi-icon {
  font-size: 1.75rem;
}

.kpi-label {
  font-size: 0.875rem;
  font-weight: 600;
  
  @apply text-slate-700 dark:text-slate-300;
}

.kpi-value {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  
  @apply text-slate-900 dark:text-white;
}

.kpi-unit {
  font-size: 0.75rem;
  
  @apply text-slate-600 dark:text-slate-400;
}

/* Charts Section */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  @apply dark:bg-slate-700;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  
  @apply text-slate-900 dark:text-white;
}

/* Stacked Bar Chart */
.stacked-bar-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stacked-bar {
  display: flex;
  height: 40px;
  background: #f3f4f6;
  border-radius: 0.5rem;
  overflow: hidden;
  gap: 2px;
  
  @apply dark:bg-slate-600;
}

.bar-segment {
  flex: 0 0 auto;
  transition: opacity 0.2s;
  position: relative;
  
  &:hover {
    opacity: 0.8;
  }
  
  &.electricity {
    background: #3b82f6;
  }
  
  &.natural-gas {
    background: #f59e0b;
  }
  
  &.liquid-fuel {
    background: #ef4444;
  }
}

.bar-legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  
  @apply text-slate-700 dark:text-slate-300;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  
  &.electricity { background: #3b82f6; }
  &.natural-gas { background: #f59e0b; }
  &.liquid-fuel { background: #ef4444; }
}

/* Gauge Chart */
.gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  position: relative;
  min-height: 200px;
  justify-content: center;
}

.gauge-svg {
  width: 220px;
  height: 150px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.gauge-background {
  opacity: 0.2;
}

.gauge-progress {
  transition: all 0.3s ease;
}

.gauge-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: absolute;
  bottom: 20px;
}

.gauge-value {
  font-size: 1.75rem;
  font-weight: 700;
  
  @apply text-slate-900 dark:text-white;
}

.gauge-label {
  font-size: 0.75rem;
  font-weight: 500;
  
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

.energy-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  text-transform: uppercase;
  
  &.energy-Electricity,
  &.energy-electricity {
    background-color: #dbeafe;
    color: #1e40af;
    
    @apply dark:bg-blue-900/30 dark:text-blue-300;
  }
  
  &.energy-Natural\ Gas,
  &.energy-natural_gas,
  &.energy-gas {
    background-color: #fef3c7;
    color: #92400e;
    
    @apply dark:bg-amber-900/30 dark:text-amber-300;
  }
  
  &.energy-Liquid\ Fuel,
  &.energy-liquid_fuel,
  &.energy-fuel {
    background-color: #fee2e2;
    color: #7f1d1d;
    
    @apply dark:bg-red-900/30 dark:text-red-300;
  }
  
  &.energy-Renewable,
  &.energy-renewable {
    background-color: #d1fae5;
    color: #065f46;
    
    @apply dark:bg-green-900/30 dark:text-green-300;
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

.energy-table {
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

.col-type {
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
    border-right: 4px solid #f59e0b;
  }
  
  .control-item {
    border-left: none;
    border-right: 2px solid #e5e7eb;
    
    @apply dark:border-slate-600;
  }
  
  .legend-item {
    flex-direction: row-reverse;
  }
  
  .bar-legend {
    flex-direction: column;
  }
  
  .group-header {
    flex-direction: row-reverse;
  }
  
  .col-type {
    text-align: center;
  }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  .narrative-section {
    background: linear-gradient(135deg, #92400e 0%, #1e3a8a 100%);
  }
}
</style>
