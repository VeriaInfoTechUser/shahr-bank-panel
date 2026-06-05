<template>
  <div class="water-detail">
    <!-- Header with Narrative -->
    <div v-if="narrative" class="narrative-section">
      <h2 class="narrative-title">{{ narrative.title }}</h2>
      <p class="narrative-body">{{ interpolatedNarrative }}</p>
    </div>

    <!-- Water Metrics Cards (4 columns) -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">💧</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.water.total_consumption') }}</div>
          <div class="metric-value">{{ formatNumber(consumption) }}</div>
          <div class="metric-unit">{{ t('units.cubic_meters') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">🌊</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.water.wastewater_discharge') }}</div>
          <div class="metric-value">{{ formatNumber(discharge) }}</div>
          <div class="metric-unit">{{ t('units.cubic_meters') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">♻️</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.water.recycled_percentage') }}</div>
          <div class="metric-value">{{ formatNumber(recycledPercentage) }}</div>
          <div class="metric-unit">%</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">📊</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.environmental.water.intensity') }}</div>
          <div class="metric-value">{{ formatNumber(intensity) }}</div>
          <div class="metric-unit">{{ t('units.intensity') }}</div>
        </div>
      </div>
    </div>

    <!-- Sankey Diagram -->
    <div class="sankey-container">
      <h3 class="section-title">{{ t('esg.environmental.water.flow_diagram') }}</h3>
      <svg class="sankey-diagram" :viewBox="`0 0 ${sankeyWidth} ${sankeyHeight}`" preserveAspectRatio="xMidYMid meet">
        <!-- Nodes (Intake, Use, Recycling, Discharge) -->
        <g class="sankey-nodes">
          <!-- Intake Node -->
          <rect x="20" y="80" width="60" height="80" fill="#1e40af" rx="4" />
          <text x="50" y="125" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
            {{ t('esg.environmental.water.intake') }}
          </text>
          <text x="50" y="140" text-anchor="middle" fill="white" font-size="10">
            {{ formatNumber(consumption) }} m³
          </text>

          <!-- Use Node -->
          <rect x="140" y="80" width="60" height="80" fill="#0369a1" rx="4" />
          <text x="170" y="125" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
            {{ t('esg.environmental.water.use') }}
          </text>
          <text x="170" y="140" text-anchor="middle" fill="white" font-size="10">
            {{ formatNumber(usageAmount) }} m³
          </text>

          <!-- Recycling Node -->
          <rect x="260" y="80" width="60" height="80" fill="#059669" rx="4" />
          <text x="290" y="125" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
            {{ t('esg.environmental.water.recycling') }}
          </text>
          <text x="290" y="140" text-anchor="middle" fill="white" font-size="10">
            {{ formatNumber(recycledAmount) }} m³
          </text>

          <!-- Discharge Node -->
          <rect x="380" y="80" width="60" height="80" fill="#7c3aed" rx="4" />
          <text x="410" y="125" text-anchor="middle" fill="white" font-size="12" font-weight="bold">
            {{ t('esg.environmental.water.discharge') }}
          </text>
          <text x="410" y="140" text-anchor="middle" fill="white" font-size="10">
            {{ formatNumber(discharge) }} m³
          </text>
        </g>

        <!-- Flows (Sankey paths) -->
        <g class="sankey-flows">
          <!-- Intake to Use flow -->
          <path
            :d="generateSankeyPath(50, 120, 170, 120, usagePercentage)"
            stroke="#0369a1"
            stroke-width="20"
            fill="none"
            opacity="0.6"
          />
          <!-- Use to Recycling flow -->
          <path
            :d="generateSankeyPath(170, 120, 290, 120, recycledPercentage / 100)"
            stroke="#059669"
            stroke-width="20"
            fill="none"
            opacity="0.6"
          />
          <!-- Use to Discharge flow -->
          <path
            :d="generateSankeyPath(170, 140, 410, 140, (100 - recycledPercentage) / 100)"
            stroke="#7c3aed"
            stroke-width="20"
            fill="none"
            opacity="0.6"
          />
          <!-- Recycling to Use (loop - internal flow) -->
          <path
            d="M 290 90 Q 350 20 170 90"
            stroke="#059669"
            stroke-width="15"
            fill="none"
            opacity="0.4"
            stroke-dasharray="5,5"
          />
        </g>
      </svg>
    </div>

    <!-- Recycling Progress Bar -->
    <div class="recycling-section">
      <h3 class="section-title">{{ t('esg.environmental.water.recycling_progress') }}</h3>
      <div class="progress-container">
        <div class="progress-bar-wrapper">
          <div class="progress-label">
            <span>{{ t('esg.environmental.water.recycled_percentage') }}</span>
            <span class="progress-value">{{ formatNumber(recycledPercentage) }}%</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: `${recycledPercentage}%` }"></div>
          </div>
          <div class="progress-goals">
            <span v-for="milestone in [25, 50, 75, 100]" :key="milestone" class="milestone">
              {{ milestone }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Water Stress Regions (if available) -->
    <div v-if="waterStressRegions.length > 0" class="stress-regions-section">
      <h3 class="section-title">{{ t('esg.environmental.water.stress_regions') }}</h3>
      <div class="regions-grid">
        <div v-for="region in waterStressRegions" :key="region.name" class="region-card">
          <div class="region-header">
            <h4 class="region-name">{{ region.name }}</h4>
            <span class="stress-level" :class="`stress-${region.stress_level}`">
              {{ region.stress_level.toUpperCase() }}
            </span>
          </div>
          <div class="region-metrics">
            <div class="region-metric">
              <span class="metric-name">{{ t('esg.environmental.water.risk_score') }}:</span>
              <span class="metric-val">{{ formatNumber(region.risk_score) }}</span>
            </div>
            <div v-if="region.volume" class="region-metric">
              <span class="metric-name">{{ t('esg.environmental.water.volume') }}:</span>
              <span class="metric-val">{{ formatNumber(region.volume) }} m³</span>
            </div>
            <div v-if="region.mitigation" class="region-metric">
              <span class="metric-name">{{ t('esg.environmental.water.mitigation') }}:</span>
              <span class="metric-val">{{ region.mitigation }}</span>
            </div>
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
              <th>{{ t('table.water_type') }}</th>
              <th>{{ t('table.value') }}</th>
              <th>{{ t('table.unit') }}</th>
              <th>{{ t('table.metric_code') }}</th>
              <th>{{ t('table.frameworks') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="control in waterControls" :key="control.id">
              <td class="title-cell">{{ control.title }}</td>
              <td class="type-cell">{{ control.water_type || '—' }}</td>
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

interface WaterControl {
  id: string
  title: string
  answer: number
  unit: string
  water_type?: string
  metric_code?: string
  frameworks?: string[]
}

interface WaterStressRegion {
  name: string
  stress_level: 'high' | 'medium' | 'low'
  risk_score: number
  volume?: number
  mitigation?: string
}

interface WaterMetadata {
  consumption?: number
  discharge?: number
  recycled_percentage?: number
  intensity?: number
  usage?: number
  recycled_amount?: number
}

interface Props {
  narrative?: {
    title: string
    body: string
  }
  metadata?: WaterMetadata
  controls?: WaterControl[]
  stressRegions?: WaterStressRegion[]
}

const props = withDefaults(defineProps<Props>(), {
  controls: () => [],
  stressRegions: () => [],
})

const { t, locale } = useI18n()

// Sankey diagram dimensions
const sankeyWidth = 460
const sankeyHeight = 220

// Extract metrics from metadata
const consumption = computed(() => props.metadata?.consumption || 0)
const discharge = computed(() => props.metadata?.discharge || 0)
const recycledPercentage = computed(() => props.metadata?.recycled_percentage || 0)
const intensity = computed(() => props.metadata?.intensity || 0)

// Computed flow amounts for Sankey
const usageAmount = computed(() => props.metadata?.usage || consumption.value * 0.85)
const recycledAmount = computed(() => (consumption.value * recycledPercentage.value) / 100)
const usagePercentage = computed(() => Math.min(usageAmount.value / consumption.value, 1))

// Water stress regions
const waterStressRegions = computed(() => props.stressRegions || [])

// Water controls for table
const waterControls = computed(() => props.controls || [])

// Interpolate narrative body with dynamic numbers
const interpolatedNarrative = computed(() => {
  if (!props.narrative?.body) return ''
  let text = props.narrative.body
  text = text.replace(/{consumption}/g, formatNumber(consumption.value))
  text = text.replace(/{discharge}/g, formatNumber(discharge.value))
  text = text.replace(/{recycled_percentage}/g, formatNumber(recycledPercentage.value))
  text = text.replace(/{intensity}/g, formatNumber(intensity.value))
  text = text.replace(/{usage}/g, formatNumber(usageAmount.value))
  return text
})

// Format numbers based on locale
function formatNumber(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0'
  const rounded = Math.round(value * 100) / 100
  const formatted = new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US').format(rounded)
  return formatted
}

// Generate Sankey path (quadratic curve for flow between nodes)
function generateSankeyPath(x1: number, y1: number, x2: number, y2: number, thickness: number): string {
  const midX = (x1 + x2) / 2
  const offset = (thickness * 10) / 2
  return `M ${x1} ${y1 - offset} Q ${midX} ${y1} ${x2} ${y2 - offset} L ${x2} ${y2 + offset} Q ${midX} ${y2} ${x1} ${y1 + offset} Z`
}
</script>

<style scoped lang="scss">
.water-detail {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(30, 144, 255, 0.02) 0%, rgba(0, 150, 136, 0.02) 100%);
  border-radius: 0.75rem;
}

// Narrative Section
.narrative-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #e0f2fe 0%, #ccfbf1 100%);
  border-radius: 0.5rem;
  border-left: 4px solid #0284c7;

  [dir='rtl'] & {
    border-left: none;
    border-right: 4px solid #0284c7;
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
  border: 1px solid #e0f2fe;
  box-shadow: 0 2px 8px rgba(30, 144, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(30, 144, 255, 0.2);
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
  }

  .metric-unit {
    font-size: 0.8rem;
    color: #0284c7;
    font-weight: 600;
  }
}

// Sankey Diagram
.sankey-container {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e0f2fe;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
    margin: 0 0 1rem 0;
  }

  .sankey-diagram {
    width: 100%;
    height: auto;
    min-height: 250px;
    background: linear-gradient(135deg, rgba(224, 242, 254, 0.3) 0%, rgba(204, 251, 241, 0.3) 100%);
    border-radius: 0.5rem;
    padding: 1rem;
  }
}

// Recycling Section
.recycling-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e0f2fe;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
    margin: 0 0 1rem 0;
  }

  .progress-container {
    padding: 1rem;
  }

  .progress-bar-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
    font-weight: 600;
    color: #0c4a6e;

    .progress-value {
      color: #059669;
      font-weight: 700;
    }
  }

  .progress-bar-bg {
    height: 12px;
    background: #e0f2fe;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }

  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #06b6d4 0%, #059669 100%);
    border-radius: 6px;
    transition: width 0.5s ease;
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
  }

  .progress-goals {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: #64748b;

    .milestone {
      flex: 1;
      text-align: center;
    }
  }
}

// Water Stress Regions Section
.stress-regions-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e0f2fe;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #0c4a6e;
    margin: 0 0 1rem 0;
  }

  .regions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
}

.region-card {
  padding: 1rem;
  border: 1px solid #e0f2fe;
  border-radius: 0.5rem;
  background: #f8fbff;
  transition: all 0.3s ease;

  &:hover {
    border-color: #0284c7;
    box-shadow: 0 2px 8px rgba(30, 144, 255, 0.15);
  }

  .region-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;

    [dir='rtl'] & {
      flex-direction: row-reverse;
    }

    .region-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: #0c4a6e;
      margin: 0;
      flex: 1;
    }

    .stress-level {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      white-space: nowrap;

      &.stress-high {
        background: #fee2e2;
        color: #991b1b;
      }

      &.stress-medium {
        background: #fef3c7;
        color: #92400e;
      }

      &.stress-low {
        background: #dcfce7;
        color: #166534;
      }
    }
  }

  .region-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .region-metric {
    font-size: 0.85rem;
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;

    [dir='rtl'] & {
      flex-direction: row-reverse;
    }

    .metric-name {
      color: #64748b;
      font-weight: 500;
    }

    .metric-val {
      color: #0c4a6e;
      font-weight: 600;
    }
  }
}

// Controls Table Section
.controls-table-section {
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e0f2fe;

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
  border: 1px solid #e0f2fe;

  .controls-table {
    width: 100%;
    border-collapse: collapse;
    background: white;

    thead {
      background: linear-gradient(135deg, #e0f2fe 0%, #ccfbf1 100%);
      position: sticky;
      top: 0;

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #0c4a6e;
        border-bottom: 2px solid #0284c7;
        font-size: 0.9rem;
        white-space: nowrap;

        [dir='rtl'] & {
          text-align: right;
        }
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #e0f2fe;
        transition: background-color 0.2s ease;

        &:hover {
          background: #f8fbff;
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

          &.type-cell {
            color: #0284c7;
            font-weight: 500;
          }

          &.value-cell {
            font-weight: 600;
            color: #059669;
          }

          &.code-cell {
            font-family: 'Courier New', monospace;
            color: #7c3aed;
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
              background: #e0e7ff;
              color: #4338ca;
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
  .water-detail {
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

  .sankey-container,
  .recycling-section,
  .stress-regions-section,
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
