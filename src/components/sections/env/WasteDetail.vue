<template>
  <div class="waste-detail">
    <!-- Header with Narrative -->
    <div v-if="narrative" class="narrative-section">
      <h2 class="narrative-title">{{ narrative.title }}</h2>
      <p class="narrative-body">{{ interpolatedNarrative }}</p>
    </div>

    <!-- Waste Breakdown Metrics (5 columns) -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">🗑️</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.waste.total_waste') }}</div>
          <div class="metric-value">{{ formatNumber(totalWaste) }}</div>
          <div class="metric-unit">{{ t('units.tonnes') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">⚠️</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.waste.hazardous_waste') }}</div>
          <div class="metric-value">{{ formatNumber(hazardousWaste) }}</div>
          <div class="metric-unit">{{ t('units.tonnes') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">♻️</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.waste.recycled_percentage') }}</div>
          <div class="metric-value">{{ formatNumber(recycledPercentage) }}</div>
          <div class="metric-unit">%</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🏭</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.waste.final_disposal_percentage') }}</div>
          <div class="metric-value">{{ formatNumber(disposalPercentage) }}</div>
          <div class="metric-unit">%</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🌱</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.waste.circular_projects') }}</div>
          <div class="metric-value">{{ circularProjects }}</div>
          <div class="metric-unit">{{ t('units.projects') }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Pie Chart: Waste by Type -->
      <div class="chart-container">
        <h3 class="chart-title">{{ t('esg.environmental.waste.waste_by_type') }}</h3>
        <svg class="pie-chart" :viewBox="`0 0 ${pieWidth} ${pieHeight}`" preserveAspectRatio="xMidYMid meet">
          <!-- Background circle -->
          <circle cx="100" cy="100" r="80" fill="#f0f9ff" stroke="#e0f2fe" stroke-width="1" />
          <!-- Pie segments -->
          <circle
            v-for="(segment, index) in wasteTypeSegments"
            :key="`segment-${index}`"
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
          <!-- Center text -->
          <text x="100" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="#0c4a6e">
            {{ t('esg.environmental.waste.total') }}
          </text>
          <text x="100" y="110" text-anchor="middle" font-size="14" font-weight="700" fill="#059669">
            {{ formatNumber(totalWaste) }}
          </text>
        </svg>
        <!-- Legend -->
        <div class="chart-legend">
          <div v-for="(type, idx) in wasteTypes" :key="`legend-${idx}`" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: wasteTypeSegments[idx]?.color }"></span>
            <span class="legend-label">{{ type }}</span>
          </div>
        </div>
      </div>

      <!-- Waterfall Chart: Waste Processing Flow -->
      <div class="chart-container">
        <h3 class="chart-title">{{ t('esg.environmental.waste.processing_flow') }}</h3>
        <svg class="waterfall-chart" :viewBox="`0 0 ${waterfallWidth} ${waterfallHeight}`" preserveAspectRatio="xMidYMid meet">
          <!-- Waterfall bars -->
          <g class="waterfall-bars">
            <!-- Total Waste bar -->
            <rect x="20" y="50" width="40" height="120" fill="#ef4444" rx="2" />
            <text x="40" y="185" text-anchor="middle" font-size="11" fill="#1f2937" font-weight="600">
              {{ t('esg.environmental.waste.total') }}
            </text>
            <text x="40" y="145" text-anchor="middle" font-size="12" font-weight="bold" fill="white">
              {{ formatNumber(totalWaste) }}
            </text>

            <!-- Recycling bar (reduction) -->
            <g>
              <line x1="60" y1="110" x2="90" y2="110" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2" />
              <rect x="90" y="50" width="40" height="85" fill="#10b981" rx="2" />
              <text x="110" y="185" text-anchor="middle" font-size="11" fill="#1f2937" font-weight="600">
                {{ t('esg.environmental.waste.recycled') }}
              </text>
              <text x="110" y="95" text-anchor="middle" font-size="12" font-weight="bold" fill="white">
                {{ formatNumber(recycledAmount) }}
              </text>
            </g>

            <!-- Hazardous bar -->
            <g>
              <line x1="130" y1="110" x2="160" y2="110" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2" />
              <rect x="160" y="100" width="40" height="70" fill="#f59e0b" rx="2" />
              <text x="180" y="185" text-anchor="middle" font-size="11" fill="#1f2937" font-weight="600">
                {{ t('esg.environmental.waste.hazardous') }}
              </text>
              <text x="180" y="140" text-anchor="middle" font-size="12" font-weight="bold" fill="white">
                {{ formatNumber(hazardousWaste) }}
              </text>
            </g>

            <!-- Final Disposal bar -->
            <g>
              <line x1="200" y1="110" x2="230" y2="110" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2" />
              <rect x="230" y="130" width="40" height="40" fill="#8b5cf6" rx="2" />
              <text x="250" y="185" text-anchor="middle" font-size="11" fill="#1f2937" font-weight="600">
                {{ t('esg.environmental.waste.disposal') }}
              </text>
              <text x="250" y="155" text-anchor="middle" font-size="12" font-weight="bold" fill="white">
                {{ formatNumber(disposalAmount) }}
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>

    <!-- Circular Economy Metrics Cards -->
    <div class="circular-economy-section">
      <h3 class="section-title">{{ t('esg.environmental.waste.circular_economy') }}</h3>
      <div class="circular-metrics-grid">
        <div v-for="metric in circularMetrics" :key="metric.id" class="circular-card">
          <div class="circular-icon">{{ metric.icon }}</div>
          <div class="circular-content">
            <div class="circular-label">{{ metric.title }}</div>
            <div class="circular-value">{{ formatNumber(metric.value) }}</div>
            <div v-if="metric.unit" class="circular-unit">{{ metric.unit }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Data Table -->
    <div class="controls-table-section">
      <h3 class="section-title">{{ t('esg.environmental.controls_list') }}</h3>
      <div class="table-wrapper">
        <table class="controls-table">
          <thead>
            <tr>
              <th>{{ t('table.title') }}</th>
              <th>{{ t('table.waste_type') }}</th>
              <th>{{ t('table.value') }}</th>
              <th>{{ t('table.unit') }}</th>
              <th>{{ t('table.metric_code') }}</th>
              <th>{{ t('table.frameworks') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="control in wasteControls" :key="control.id">
              <td class="title-cell">{{ control.title }}</td>
              <td class="type-cell">{{ control.waste_type || '—' }}</td>
              <td class="value-cell">{{ formatNumber(control.answer) }}</td>
              <td class="unit-cell">{{ control.unit || '—' }}</td>
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

interface WasteControl {
  id: string
  title: string
  answer: number
  unit: string
  waste_type?: string
  metric_code?: string
  frameworks?: string[]
}

interface CircularMetric {
  id: string
  title: string
  icon: string
  value: number
  unit?: string
}

interface WasteMetadata {
  total_waste?: number
  hazardous_waste?: number
  recycled_percentage?: number
  disposal_percentage?: number
  circular_projects?: number
  recycled_amount?: number
  disposal_amount?: number
  waste_types?: { name: string; amount: number; percentage: number }[]
  circular_metrics?: CircularMetric[]
}

interface Props {
  narrative?: {
    title: string
    body: string
  }
  metadata?: WasteMetadata
  controls?: WasteControl[]
}

const props = withDefaults(defineProps<Props>(), {
  controls: () => [],
})

const { t, locale } = useI18n()

// Chart dimensions
const pieWidth = 280
const pieHeight = 320
const waterfallWidth = 300
const waterfallHeight = 220

// Extract metrics from metadata
const totalWaste = computed(() => props.metadata?.total_waste || 0)
const hazardousWaste = computed(() => props.metadata?.hazardous_waste || 0)
const recycledPercentage = computed(() => props.metadata?.recycled_percentage || 0)
const disposalPercentage = computed(() => props.metadata?.disposal_percentage || 0)
const circularProjects = computed(() => props.metadata?.circular_projects || 0)

// Computed flow amounts for waterfall
const recycledAmount = computed(() => props.metadata?.recycled_amount || (totalWaste.value * recycledPercentage.value) / 100)
const disposalAmount = computed(() => props.metadata?.disposal_amount || (totalWaste.value * disposalPercentage.value) / 100)

// Waste types for pie chart
const wasteTypes = computed(() => {
  if (props.metadata?.waste_types && props.metadata.waste_types.length > 0) {
    return props.metadata.waste_types.map(w => w.name)
  }
  return [
    t('esg.environmental.waste.type_organic'),
    t('esg.environmental.waste.type_plastic'),
    t('esg.environmental.waste.type_metal'),
    t('esg.environmental.waste.type_electronic'),
  ]
})

// Pie chart segments with colors
const wasteTypeSegments = computed(() => {
  const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6']
  const circumference = 2 * Math.PI * 80

  if (props.metadata?.waste_types && props.metadata.waste_types.length > 0) {
    const segments = props.metadata.waste_types
    let offset = 0
    return segments.map((segment, idx) => {
      const dashLength = (segment.percentage / 100) * circumference
      const dashOffset = offset
      offset += dashLength
      return {
        color: colors[idx % colors.length],
        dashArray: `${dashLength} ${circumference}`,
        dashOffset: -dashOffset,
      }
    })
  }

  // Default segments (equal distribution)
  const segmentLength = circumference / wasteTypes.value.length
  return wasteTypes.value.map((_, idx) => ({
    color: colors[idx % colors.length],
    dashArray: `${segmentLength} ${circumference}`,
    dashOffset: -(idx * segmentLength),
  }))
})

// Circular economy metrics
const circularMetrics = computed(() => {
  if (props.metadata?.circular_metrics && props.metadata.circular_metrics.length > 0) {
    return props.metadata.circular_metrics
  }
  return [
    {
      id: 'reuse_rate',
      title: t('esg.environmental.waste.reuse_rate'),
      icon: '🔄',
      value: recycledPercentage.value,
      unit: '%',
    },
    {
      id: 'recovery_rate',
      title: t('esg.environmental.waste.recovery_rate'),
      icon: '🏭',
      value: 65,
      unit: '%',
    },
    {
      id: 'waste_reduction',
      title: t('esg.environmental.waste.reduction_target'),
      icon: '📉',
      value: 40,
      unit: '%',
    },
    {
      id: 'landfill_diversion',
      title: t('esg.environmental.waste.landfill_diversion'),
      icon: '⛔',
      value: 75,
      unit: '%',
    },
  ]
})

// Waste controls for table
const wasteControls = computed(() => props.controls || [])

// Interpolate narrative body with dynamic numbers
const interpolatedNarrative = computed(() => {
  if (!props.narrative?.body) return ''
  let text = props.narrative.body
  text = text.replace(/{total_waste}/g, formatNumber(totalWaste.value))
  text = text.replace(/{hazardous_waste}/g, formatNumber(hazardousWaste.value))
  text = text.replace(/{recycled_percentage}/g, formatNumber(recycledPercentage.value))
  text = text.replace(/{disposal_percentage}/g, formatNumber(disposalPercentage.value))
  text = text.replace(/{circular_projects}/g, circularProjects.value.toString())
  text = text.replace(/{recycled_amount}/g, formatNumber(recycledAmount.value))
  text = text.replace(/{disposal_amount}/g, formatNumber(disposalAmount.value))
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
.waste-detail {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.02) 0%, rgba(245, 158, 11, 0.02) 100%);
  border-radius: 0.75rem;
}

// Narrative Section
.narrative-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fef3c7 100%);
  border-radius: 0.5rem;
  border-left: 4px solid #dc2626;

  [dir='rtl'] & {
    border-left: none;
    border-right: 4px solid #dc2626;
  }

  .narrative-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #7f1d1d;
    margin: 0 0 0.75rem 0;
  }

  .narrative-body {
    margin: 0;
    color: #7f1d1d;
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

// Metrics Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #fee2e2;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
    transform: translateY(-2px);
  }

  .metric-icon {
    font-size: 2.5rem;
    min-width: 2.5rem;
  }

  .metric-content {
    flex: 1;
  }

  .metric-label {
    font-size: 0.8rem;
    color: #64748b;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #7f1d1d;
    margin-bottom: 0.25rem;
  }

  .metric-unit {
    font-size: 0.75rem;
    color: #dc2626;
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
  border: 1px solid #fee2e2;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.05);

  .chart-title {
    font-size: 1rem;
    font-weight: 600;
    color: #7f1d1d;
    margin: 0 0 1rem 0;
  }

  .pie-chart {
    width: 100%;
    height: auto;
    min-height: 250px;
    margin-bottom: 1rem;
  }

  .waterfall-chart {
    width: 100%;
    height: auto;
    min-height: 220px;
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

// Circular Economy Section
.circular-economy-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #fee2e2;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #7f1d1d;
    margin: 0 0 1rem 0;
  }

  .circular-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.5rem;

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
}

.circular-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1.25rem;
  background: linear-gradient(135deg, #fef2f2 0%, #fef3c7 100%);
  border-radius: 0.5rem;
  border: 1px solid #fed7aa;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
    transform: translateY(-2px);
  }

  .circular-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .circular-label {
    font-size: 0.85rem;
    color: #92400e;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .circular-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #7f1d1d;
    margin-bottom: 0.25rem;
  }

  .circular-unit {
    font-size: 0.75rem;
    color: #d97706;
    font-weight: 600;
  }
}

// Controls Table Section
.controls-table-section {
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #fee2e2;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #7f1d1d;
    margin: 0 0 1rem 0;
  }
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #fee2e2;

  .controls-table {
    width: 100%;
    border-collapse: collapse;
    background: white;

    thead {
      background: linear-gradient(135deg, #fef2f2 0%, #fef3c7 100%);
      position: sticky;
      top: 0;

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #7f1d1d;
        border-bottom: 2px solid #dc2626;
        font-size: 0.9rem;
        white-space: nowrap;

        [dir='rtl'] & {
          text-align: right;
        }
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #fee2e2;
        transition: background-color 0.2s ease;

        &:hover {
          background: #fffaf9;
        }

        td {
          padding: 1rem;
          color: #475569;
          font-size: 0.9rem;

          &.title-cell {
            font-weight: 600;
            color: #7f1d1d;
            max-width: 200px;
            word-wrap: break-word;
          }

          &.type-cell {
            color: #dc2626;
            font-weight: 500;
          }

          &.value-cell {
            font-weight: 600;
            color: #d97706;
          }

          &.code-cell {
            font-family: 'Courier New', monospace;
            color: #9333ea;
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
              background: #fee2e2;
              color: #991b1b;
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
  .waste-detail {
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

  .circular-economy-section,
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
