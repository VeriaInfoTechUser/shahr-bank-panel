<template>
  <div class="workforce-detail">
    <!-- Header with Narrative -->
    <div v-if="narrative" class="narrative-section">
      <h2 class="narrative-title">{{ narrative.title }}</h2>
      <p class="narrative-body">{{ interpolatedNarrative }}</p>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.workforce.total_employees') }}</div>
          <div class="metric-value">{{ formatNumber(totalEmployees) }}</div>
          <div class="metric-unit">{{ t('units.employees') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🕐</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.workforce.full_time') }}</div>
          <div class="metric-value">{{ formatNumber(fullTimeCount) }}</div>
          <div class="metric-unit">{{ formatNumber(fullTimePercentage) }}%</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">⏱️</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.workforce.part_time') }}</div>
          <div class="metric-value">{{ formatNumber(partTimeCount) }}</div>
          <div class="metric-unit">{{ formatNumber(partTimePercentage) }}%</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">📊</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.workforce.growth_rate') }}</div>
          <div class="metric-value" :class="growthRate >= 0 ? 'positive' : 'negative'">
            {{ growthRate >= 0 ? '+' : '' }}{{ formatNumber(growthRate) }}%
          </div>
          <div class="metric-unit">{{ t('esg.social.workforce.year_over_year') }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Gender Breakdown Pie -->
      <div v-if="genderData.length > 0" class="chart-container">
        <h3 class="chart-title">{{ t('esg.social.workforce.gender_breakdown') }}</h3>
        <svg class="pie-chart" :viewBox="`0 0 ${pieWidth} ${pieHeight}`" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="100" r="80" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
          <circle
            v-for="(segment, index) in genderSegments"
            :key="`gender-segment-${index}`"
            cx="100"
            cy="100"
            r="80"
            :fill="'none'"
            :stroke="segment.color"
            stroke-width="25"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            stroke-linecap="round"
          />
          <text x="100" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">
            {{ t('esg.social.workforce.gender') }}
          </text>
          <text x="100" y="110" text-anchor="middle" font-size="14" font-weight="700" fill="#0891b2">
            {{ genderData.length }}
          </text>
        </svg>
        <div class="chart-legend">
          <div v-for="(item, idx) in genderData" :key="`gender-legend-${idx}`" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: genderSegments[idx]?.color }"></span>
            <span class="legend-label">{{ item.label }}: {{ formatNumber(item.value) }}</span>
          </div>
        </div>
      </div>

      <!-- Employment Type Breakdown Pie -->
      <div v-if="employmentTypeData.length > 0" class="chart-container">
        <h3 class="chart-title">{{ t('esg.social.workforce.employment_type') }}</h3>
        <svg class="pie-chart" :viewBox="`0 0 ${pieWidth} ${pieHeight}`" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="100" r="80" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
          <circle
            v-for="(segment, index) in employmentTypeSegments"
            :key="`employment-segment-${index}`"
            cx="100"
            cy="100"
            r="80"
            :fill="'none'"
            :stroke="segment.color"
            stroke-width="25"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            stroke-linecap="round"
          />
          <text x="100" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">
            {{ t('esg.social.workforce.employment_type') }}
          </text>
          <text x="100" y="110" text-anchor="middle" font-size="14" font-weight="700" fill="#0891b2">
            {{ employmentTypeData.length }}
          </text>
        </svg>
        <div class="chart-legend">
          <div v-for="(item, idx) in employmentTypeData" :key="`employment-legend-${idx}`" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: employmentTypeSegments[idx]?.color }"></span>
            <span class="legend-label">{{ item.label }}: {{ formatNumber(item.value) }}</span>
          </div>
        </div>
      </div>

      <!-- Contract Type Breakdown Pie -->
      <div v-if="contractTypeData.length > 0" class="chart-container">
        <h3 class="chart-title">{{ t('esg.social.workforce.contract_type') }}</h3>
        <svg class="pie-chart" :viewBox="`0 0 ${pieWidth} ${pieHeight}`" preserveAspectRatio="xMidYMid meet">
          <circle cx="100" cy="100" r="80" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" />
          <circle
            v-for="(segment, index) in contractTypeSegments"
            :key="`contract-segment-${index}`"
            cx="100"
            cy="100"
            r="80"
            :fill="'none'"
            :stroke="segment.color"
            stroke-width="25"
            :stroke-dasharray="segment.dashArray"
            :stroke-dashoffset="segment.dashOffset"
            stroke-linecap="round"
          />
          <text x="100" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#1e293b">
            {{ t('esg.social.workforce.contract_type') }}
          </text>
          <text x="100" y="110" text-anchor="middle" font-size="14" font-weight="700" fill="#0891b2">
            {{ contractTypeData.length }}
          </text>
        </svg>
        <div class="chart-legend">
          <div v-for="(item, idx) in contractTypeData" :key="`contract-legend-${idx}`" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: contractTypeSegments[idx]?.color }"></span>
            <span class="legend-label">{{ item.label }}: {{ formatNumber(item.value) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Growth Trend Chart -->
    <div v-if="growthTrendData.length > 0" class="growth-chart-container">
      <h3 class="chart-title">{{ t('esg.social.workforce.growth_trend') }}</h3>
      <svg class="line-chart" :viewBox="`0 0 ${lineChartWidth} ${lineChartHeight}`" preserveAspectRatio="xMidYMid meet">
        <!-- Grid lines -->
        <g class="grid-lines" stroke="#e2e8f0" stroke-width="1">
          <line x1="50" y1="30" x2="50" y2="250" stroke="#e2e8f0" />
          <line x1="50" y1="250" x2="550" y2="250" stroke="#e2e8f0" />
        </g>

        <!-- Data line -->
        <polyline
          :points="lineChartPath"
          fill="none"
          stroke="#0891b2"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Data points -->
        <circle
          v-for="(point, idx) in lineChartPoints"
          :key="`point-${idx}`"
          :cx="point.x"
          :cy="point.y"
          r="4"
          fill="#0891b2"
          stroke="white"
          stroke-width="2"
        />

        <!-- Axis labels (Y) -->
        <text x="40" y="35" text-anchor="end" font-size="10" fill="#64748b">
          {{ formatNumber(maxEmployees) }}
        </text>
        <text x="40" y="140" text-anchor="end" font-size="10" fill="#64748b">
          {{ formatNumber(maxEmployees / 2) }}
        </text>
        <text x="40" y="255" text-anchor="end" font-size="10" fill="#64748b">0</text>

        <!-- Axis labels (X) -->
        <text v-for="(data, idx) in growthTrendData" :key="`label-${idx}`" :x="getXCoord(idx)" y="270" text-anchor="middle" font-size="9" fill="#64748b">
          {{ data.period }}
        </text>
      </svg>
    </div>

    <!-- Detailed Controls Table -->
    <div class="controls-table-section">
      <h3 class="section-title">{{ t('esg.social.workforce.controls_list') }}</h3>
      <div class="table-wrapper">
        <table class="controls-table">
          <thead>
            <tr>
              <th>{{ t('table.title') }}</th>
              <th>{{ t('table.value') }}</th>
              <th>{{ t('table.unit') }}</th>
              <th>{{ t('table.category') }}</th>
              <th>{{ t('table.metric_code') }}</th>
              <th>{{ t('table.frameworks') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="control in workforceControls" :key="control.id">
              <td class="title-cell">{{ control.title }}</td>
              <td class="value-cell">{{ formatNumber(control.answer) }}</td>
              <td class="unit-cell">{{ control.unit || '—' }}</td>
              <td class="category-cell">{{ control.category || '—' }}</td>
              <td class="code-cell">{{ control.metric_code || '—' }}</td>
              <td class="frameworks-cell">
                <span v-if="control.frameworks && control.frameworks.length > 0" class="frameworks">
                  <span v-for="fw in control.frameworks" :key="fw" class="badge">{{ fw }}</span>
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

interface WorkforceControl {
  id: string
  title: string
  answer: number
  unit: string
  category?: string
  metric_code?: string
  frameworks?: string[]
}

interface ChartData {
  label: string
  value: number
  percentage: number
}

interface WorkforceMetadata {
  total_employees?: number
  full_time?: number
  part_time?: number
  growth_rate?: number
  previous_year_count?: number
  gender?: { [key: string]: number }
  employment_type?: { [key: string]: number }
  contract_type?: { [key: string]: number }
  growth_trend?: { period: string; count: number }[]
  age_groups?: { [key: string]: number }
  regions?: { [key: string]: number }
}

interface Props {
  narrative?: {
    title: string
    body: string
  }
  metadata?: WorkforceMetadata
  controls?: WorkforceControl[]
}

const props = withDefaults(defineProps<Props>(), {
  controls: () => [],
})

const { t, locale } = useI18n()

// Chart dimensions
const pieWidth = 280
const pieHeight = 320
const lineChartWidth = 600
const lineChartHeight = 300

// Extract metrics
const totalEmployees = computed(() => props.metadata?.total_employees || 0)
const fullTimeCount = computed(() => props.metadata?.full_time || 0)
const partTimeCount = computed(() => props.metadata?.part_time || 0)
const fullTimePercentage = computed(() => (totalEmployees.value > 0 ? (fullTimeCount.value / totalEmployees.value) * 100 : 0))
const partTimePercentage = computed(() => (totalEmployees.value > 0 ? (partTimeCount.value / totalEmployees.value) * 100 : 0))
const growthRate = computed(() => props.metadata?.growth_rate || 0)

// Gender breakdown data
const genderData = computed((): ChartData[] => {
  if (!props.metadata?.gender || Object.keys(props.metadata.gender).length === 0) return []
  const total = Object.values(props.metadata.gender).reduce((sum, val) => sum + val, 0)
  return Object.entries(props.metadata.gender).map(([key, value]) => ({
    label: key,
    value: value as number,
    percentage: total > 0 ? ((value as number) / total) * 100 : 0,
  }))
})

// Employment type breakdown data
const employmentTypeData = computed((): ChartData[] => {
  if (!props.metadata?.employment_type || Object.keys(props.metadata.employment_type).length === 0) return []
  const total = Object.values(props.metadata.employment_type).reduce((sum, val) => sum + val, 0)
  return Object.entries(props.metadata.employment_type).map(([key, value]) => ({
    label: key,
    value: value as number,
    percentage: total > 0 ? ((value as number) / total) * 100 : 0,
  }))
})

// Contract type breakdown data
const contractTypeData = computed((): ChartData[] => {
  if (!props.metadata?.contract_type || Object.keys(props.metadata.contract_type).length === 0) return []
  const total = Object.values(props.metadata.contract_type).reduce((sum, val) => sum + val, 0)
  return Object.entries(props.metadata.contract_type).map(([key, value]) => ({
    label: key,
    value: value as number,
    percentage: total > 0 ? ((value as number) / total) * 100 : 0,
  }))
})

// Pie chart segments generator
function generatePieSegments(data: ChartData[]) {
  const colors = ['#0891b2', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#ef4444']
  const circumference = 2 * Math.PI * 80
  const segments = []
  let offset = 0

  for (let i = 0; i < data.length; i++) {
    const percentage = data[i].percentage
    const dashLength = (percentage / 100) * circumference
    segments.push({
      color: colors[i % colors.length],
      dashArray: `${dashLength} ${circumference}`,
      dashOffset: -offset,
    })
    offset += dashLength
  }

  return segments
}

const genderSegments = computed(() => generatePieSegments(genderData.value))
const employmentTypeSegments = computed(() => generatePieSegments(employmentTypeData.value))
const contractTypeSegments = computed(() => generatePieSegments(contractTypeData.value))

// Growth trend data
const growthTrendData = computed(() => props.metadata?.growth_trend || [])
const maxEmployees = computed(() => {
  if (growthTrendData.value.length === 0) return totalEmployees.value
  return Math.max(...growthTrendData.value.map(d => d.count), totalEmployees.value)
})

const lineChartPoints = computed(() => {
  if (growthTrendData.value.length === 0) return []
  const xStep = 500 / (growthTrendData.value.length - 1 || 1)
  const yScale = 220 / (maxEmployees.value || 1)

  return growthTrendData.value.map((data, idx) => ({
    x: 50 + idx * xStep,
    y: 250 - data.count * yScale,
  }))
})

const lineChartPath = computed(() => lineChartPoints.value.map((p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' '))

function getXCoord(idx: number): number {
  if (growthTrendData.value.length <= 1) return 300
  return 50 + (idx / (growthTrendData.value.length - 1)) * 500
}

// Workforce controls for table
const workforceControls = computed(() => props.controls || [])

// Interpolate narrative
const interpolatedNarrative = computed(() => {
  if (!props.narrative?.body) return ''
  let text = props.narrative.body
  text = text.replace(/{total_employees}/g, formatNumber(totalEmployees.value))
  text = text.replace(/{full_time}/g, formatNumber(fullTimeCount.value))
  text = text.replace(/{part_time}/g, formatNumber(partTimeCount.value))
  text = text.replace(/{growth_rate}/g, formatNumber(growthRate.value))
  text = text.replace(/{full_time_percentage}/g, formatNumber(fullTimePercentage.value))
  text = text.replace(/{part_time_percentage}/g, formatNumber(partTimePercentage.value))
  return text
})

// Format numbers based on locale
function formatNumber(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0'
  const rounded = Math.round(value * 100) / 100
  const formatted = new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US').format(rounded)
  return formatted
}
</script>

<style scoped lang="scss">
.workforce-detail {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%);
  border-radius: 0.75rem;
}

// Narrative Section
.narrative-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #ecfdf5 0%, #cffafe 100%);
  border-radius: 0.5rem;
  border-left: 4px solid #0891b2;

  [dir='rtl'] & {
    border-left: none;
    border-right: 4px solid #0891b2;
  }

  .narrative-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0c4a6e;
    margin: 0 0 0.75rem 0;
  }

  .narrative-body {
    margin: 0;
    color: #0c4a6e;
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

// Metrics Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #cffafe;
  box-shadow: 0 2px 8px rgba(8, 145, 178, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(8, 145, 178, 0.2);
    transform: translateY(-2px);
  }

  .metric-icon {
    font-size: 2.5rem;
    min-width: 3rem;
  }

  .metric-content {
    flex: 1;
  }

  .metric-label {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  .metric-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #0c4a6e;
    margin-bottom: 0.25rem;

    &.positive {
      color: #10b981;
    }

    &.negative {
      color: #ef4444;
    }
  }

  .metric-unit {
    font-size: 0.8rem;
    color: #0891b2;
    font-weight: 600;
  }
}

// Charts Grid
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.chart-container {
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #cffafe;
  box-shadow: 0 2px 8px rgba(8, 145, 178, 0.05);

  .chart-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
    margin: 0 0 1rem 0;
  }

  .pie-chart {
    width: 100%;
    height: auto;
    min-height: 250px;
    margin-bottom: 1rem;
  }
}

.chart-legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .legend-label {
      color: #64748b;
      font-weight: 500;
    }
  }
}

// Growth Chart
.growth-chart-container {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #cffafe;
  box-shadow: 0 2px 8px rgba(8, 145, 178, 0.05);

  .chart-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
    margin: 0 0 1rem 0;
  }

  .line-chart {
    width: 100%;
    height: auto;
    min-height: 300px;
  }
}

// Controls Table Section
.controls-table-section {
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #cffafe;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
    margin: 0 0 1rem 0;
  }
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #cffafe;

  .controls-table {
    width: 100%;
    border-collapse: collapse;
    background: white;

    thead {
      background: linear-gradient(135deg, #ecfdf5 0%, #cffafe 100%);
      position: sticky;
      top: 0;

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #0c4a6e;
        border-bottom: 2px solid #0891b2;
        font-size: 0.9rem;
        white-space: nowrap;

        [dir='rtl'] & {
          text-align: right;
        }
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #cffafe;
        transition: background-color 0.2s ease;

        &:hover {
          background: #f0f9fc;
        }

        td {
          padding: 1rem;
          color: #475569;
          font-size: 0.9rem;

          &.title-cell {
            font-weight: 600;
            color: #0c4a6e;
            max-width: 200px;
            word-wrap: break-word;
          }

          &.value-cell {
            font-weight: 600;
            color: #0891b2;
          }

          &.code-cell {
            font-family: 'Courier New', monospace;
            color: #0891b2;
            font-size: 0.85rem;
          }

          &.frameworks-cell {
            .frameworks {
              display: flex;
              flex-wrap: wrap;
              gap: 0.25rem;

              [dir='rtl'] & {
                flex-direction: row-reverse;
              }
            }

            .badge {
              display: inline-block;
              padding: 0.25rem 0.5rem;
              background: #cffafe;
              color: #0c4a6e;
              border-radius: 0.25rem;
              font-size: 0.75rem;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .workforce-detail {
    padding: 1rem;
  }

  .narrative-section {
    padding: 1rem;
    margin-bottom: 1.5rem;

    .narrative-title {
      font-size: 1.1rem;
    }

    .narrative-body {
      font-size: 0.9rem;
    }
  }

  .metrics-grid {
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    padding: 1rem;
  }

  .charts-grid {
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .growth-chart-container,
  .controls-table-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .table-wrapper {
    .controls-table {
      thead th {
        padding: 0.75rem;
        font-size: 0.8rem;
      }

      tbody td {
        padding: 0.75rem;
        font-size: 0.8rem;
      }
    }
  }
}
</style>
