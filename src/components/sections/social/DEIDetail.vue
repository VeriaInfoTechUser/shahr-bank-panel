<template>
  <div class="dei-detail">
    <!-- Header with Narrative -->
    <div v-if="narrative" class="narrative-section">
      <h2 class="narrative-title">{{ narrative.title }}</h2>
      <p class="narrative-body">{{ interpolatedNarrative }}</p>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-icon">💰</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.dei.wage_gap') }}</div>
          <div class="metric-value" :class="wageGap <= 10 ? 'positive' : 'warning'">
            {{ formatNumber(wageGap) }}%
          </div>
          <div class="metric-unit">{{ t('units.percentage_gap') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">👥</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.dei.underrepresented') }}</div>
          <div class="metric-value">{{ formatNumber(underrepresentedGroups) }}%</div>
          <div class="metric-unit">{{ t('esg.social.dei.in_workforce') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">👩‍💼</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.dei.female_leadership') }}</div>
          <div class="metric-value">{{ formatNumber(femaleLeadership) }}%</div>
          <div class="metric-unit">{{ t('esg.social.dei.management_positions') }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon">📊</div>
        <div class="metric-content">
          <div class="metric-label">{{ t('esg.social.dei.gender_ratio') }}</div>
          <div class="metric-value">{{ formatNumber(maleRatio) }}% / {{ formatNumber(femaleRatio) }}%</div>
          <div class="metric-unit">{{ t('esg.social.dei.overall') }}</div>
        </div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Gender Distribution Comparison Bar Chart -->
      <div v-if="genderDistributionData.length > 0" class="chart-container">
        <h3 class="chart-title">{{ t('esg.social.dei.gender_distribution') }}</h3>
        <svg class="bar-chart" :viewBox="`0 0 ${barChartWidth} ${barChartHeight}`" preserveAspectRatio="xMidYMid meet">
          <!-- Grid background -->
          <g class="grid-lines" stroke="#e2e8f0" stroke-width="1" opacity="0.5">
            <line x1="50" y1="20" x2="50" y2="240" />
            <line x1="50" y1="240" x2="480" y2="240" />
          </g>

          <!-- Bars -->
          <g v-for="(item, idx) in genderDistributionData" :key="`bar-${idx}`">
            <!-- Male bar -->
            <rect
              :x="50 + idx * 100"
              :y="240 - (item.male / 100) * 220"
              width="35"
              height="(item.male / 100) * 220"
              fill="#7c3aed"
              rx="4"
            />
            <!-- Female bar -->
            <rect
              :x="50 + idx * 100 + 40"
              :y="240 - (item.female / 100) * 220"
              width="35"
              height="(item.female / 100) * 220"
              fill="#ec4899"
              rx="4"
            />

            <!-- Level label -->
            <text :x="50 + idx * 100 + 37.5" y="260" text-anchor="middle" font-size="9" fill="#64748b">
              {{ item.level }}
            </text>
          </g>

          <!-- Y-axis scale -->
          <text x="40" y="25" text-anchor="end" font-size="9" fill="#64748b">100%</text>
          <text x="40" y="130" text-anchor="end" font-size="9" fill="#64748b">50%</text>
          <text x="40" y="245" text-anchor="end" font-size="9" fill="#64748b">0%</text>
        </svg>

        <!-- Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color" style="background-color: #7c3aed;"></span>
            <span class="legend-label">{{ t('esg.social.dei.male') }}</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #ec4899;"></span>
            <span class="legend-label">{{ t('esg.social.dei.female') }}</span>
          </div>
        </div>
      </div>

      <!-- Minority Representation Bar Chart -->
      <div v-if="minorityRepresentationData.length > 0" class="chart-container">
        <h3 class="chart-title">{{ t('esg.social.dei.minority_representation') }}</h3>
        <svg class="bar-chart" :viewBox="`0 0 ${barChartWidth} ${barChartHeight}`" preserveAspectRatio="xMidYMid meet">
          <!-- Grid background -->
          <g class="grid-lines" stroke="#e2e8f0" stroke-width="1" opacity="0.5">
            <line x1="50" y1="20" x2="50" y2="240" />
            <line x1="50" y1="240" x2="480" y2="240" />
          </g>

          <!-- Bars -->
          <g v-for="(item, idx) in minorityRepresentationData" :key="`minority-bar-${idx}`">
            <rect
              :x="50 + idx * 100"
              :y="240 - (item.percentage / 100) * 220"
              width="70"
              height="(item.percentage / 100) * 220"
              :fill="item.color"
              rx="4"
            />

            <!-- Group label -->
            <text :x="50 + idx * 100 + 35" y="260" text-anchor="middle" font-size="9" fill="#64748b" word-wrap="break-word">
              {{ item.label.substring(0, 10) }}
            </text>
          </g>

          <!-- Y-axis scale -->
          <text x="40" y="25" text-anchor="end" font-size="9" fill="#64748b">100%</text>
          <text x="40" y="130" text-anchor="end" font-size="9" fill="#64748b">50%</text>
          <text x="40" y="245" text-anchor="end" font-size="9" fill="#64748b">0%</text>
        </svg>
      </div>
    </div>

    <!-- Representation Heatmap by Department -->
    <div v-if="departmentRepresentation.length > 0" class="heatmap-container">
      <h3 class="chart-title">{{ t('esg.social.dei.department_representation') }}</h3>
      <svg class="heatmap" :viewBox="`0 0 ${heatmapWidth} ${heatmapHeight}`" preserveAspectRatio="xMidYMid meet">
        <!-- Y-axis labels (departments) -->
        <g v-for="(dept, idx) in departmentRepresentation" :key="`dept-${idx}`">
          <text x="5" :y="50 + idx * 40 + 20" font-size="10" fill="#64748b" text-anchor="start">
            {{ dept.department.substring(0, 12) }}
          </text>
        </g>

        <!-- X-axis labels (groups) -->
        <g v-for="(group, idx) in deiGroups" :key="`group-${idx}`">
          <text :x="120 + idx * 50 + 25" y="35" font-size="9" fill="#64748b" text-anchor="middle">
            {{ group.substring(0, 8) }}
          </text>
        </g>

        <!-- Heatmap cells -->
        <g v-for="(dept, deptIdx) in departmentRepresentation" :key="`heatmap-${deptIdx}`">
          <g v-for="(group, groupIdx) in deiGroups" :key="`cell-${deptIdx}-${groupIdx}`">
            <rect
              :x="120 + groupIdx * 50"
              :y="50 + deptIdx * 40"
              width="45"
              height="35"
              :fill="getHeatmapColor(dept.groups?.[group] || 0)"
              stroke="#ffffff"
              stroke-width="2"
            />
            <text
              :x="120 + groupIdx * 50 + 22.5"
              :y="50 + deptIdx * 40 + 22"
              text-anchor="middle"
              font-size="10"
              font-weight="600"
              fill="#ffffff"
            >
              {{ formatNumber(dept.groups?.[group] || 0) }}%
            </text>
          </g>
        </g>
      </svg>

      <!-- Heatmap legend -->
      <div class="heatmap-legend">
        <div class="legend-row">
          <span v-for="i in 5" :key="`legend-${i}`" class="legend-cell">
            <span class="legend-color" :style="{ backgroundColor: getHeatmapColor((i - 1) * 25) }"></span>
            <span class="legend-label">{{ (i - 1) * 25 }}%</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Progress toward Targets -->
    <div v-if="targetProgress.length > 0" class="progress-container">
      <h3 class="chart-title">{{ t('esg.social.dei.progress_toward_targets') }}</h3>
      <div class="progress-items">
        <div v-for="target in targetProgress" :key="target.id" class="progress-item">
          <div class="progress-header">
            <span class="progress-label">{{ target.label }}</span>
            <span class="progress-percentage">{{ formatNumber(target.current) }}% / {{ formatNumber(target.target) }}%</span>
          </div>
          <svg class="progress-bar" viewBox="0 0 100 20" preserveAspectRatio="xMidYMid meet">
            <!-- Background -->
            <rect x="0" y="5" width="100" height="10" fill="#e2e8f0" rx="5" />
            <!-- Progress -->
            <rect x="0" y="5" :width="(target.current / target.target) * 100" height="10" fill="#10b981" rx="5" />
            <!-- Target marker -->
            <line x1="100" y1="0" x2="100" y2="20" stroke="#0891b2" stroke-width="2" stroke-dasharray="2,2" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Detailed Controls Table -->
    <div class="controls-table-section">
      <h3 class="section-title">{{ t('esg.social.dei.controls_list') }}</h3>
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
            <tr v-for="control in deiControls" :key="control.id">
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

interface DEIControl {
  id: string
  title: string
  answer: number
  unit: string
  category?: string
  metric_code?: string
  frameworks?: string[]
}

interface GenderDistribution {
  level: string
  male: number
  female: number
}

interface MinorityRepresentation {
  label: string
  percentage: number
  color: string
}

interface DepartmentRepresentation {
  department: string
  groups?: { [key: string]: number }
}

interface TargetProgress {
  id: string
  label: string
  current: number
  target: number
}

interface DEIMetadata {
  wage_gap?: number
  underrepresented_groups?: number
  female_leadership?: number
  male_ratio?: number
  female_ratio?: number
  gender_by_level?: GenderDistribution[]
  minority_representation?: MinorityRepresentation[]
  department_representation?: DepartmentRepresentation[]
  target_progress?: TargetProgress[]
}

interface Props {
  narrative?: {
    title: string
    body: string
  }
  metadata?: DEIMetadata
  controls?: DEIControl[]
}

const props = withDefaults(defineProps<Props>(), {
  controls: () => [],
})

const { t, locale } = useI18n()

// Chart dimensions
const barChartWidth = 500
const barChartHeight = 280
const heatmapWidth = 550
const heatmapHeight = computed(() => 50 + departmentRepresentation.value.length * 40)

// Extract metrics
const wageGap = computed(() => props.metadata?.wage_gap || 0)
const underrepresentedGroups = computed(() => props.metadata?.underrepresented_groups || 0)
const femaleLeadership = computed(() => props.metadata?.female_leadership || 0)
const maleRatio = computed(() => props.metadata?.male_ratio || 0)
const femaleRatio = computed(() => props.metadata?.female_ratio || 0)

// Gender by level data
const genderDistributionData = computed((): GenderDistribution[] => {
  return props.metadata?.gender_by_level || []
})

// Minority representation data
const minorityRepresentationData = computed((): MinorityRepresentation[] => {
  return props.metadata?.minority_representation || []
})

// Department representation
const departmentRepresentation = computed((): DepartmentRepresentation[] => {
  return props.metadata?.department_representation || []
})

// DEI groups for heatmap
const deiGroups = computed(() => {
  if (departmentRepresentation.value.length === 0) return []
  const dept = departmentRepresentation.value[0]
  return Object.keys(dept.groups || {})
})

// Target progress data
const targetProgress = computed((): TargetProgress[] => {
  return props.metadata?.target_progress || []
})

// Heatmap color generator (cold to hot: blue to red)
function getHeatmapColor(percentage: number): string {
  if (percentage < 10) return '#e0e7ff'
  if (percentage < 25) return '#a5d6ff'
  if (percentage < 50) return '#7dd3fc'
  if (percentage < 75) return '#34d399'
  return '#10b981'
}

// DEI controls for table
const deiControls = computed(() => props.controls || [])

// Interpolate narrative
const interpolatedNarrative = computed(() => {
  if (!props.narrative?.body) return ''
  let text = props.narrative.body
  text = text.replace(/{wage_gap}/g, formatNumber(wageGap.value))
  text = text.replace(/{underrepresented_groups}/g, formatNumber(underrepresentedGroups.value))
  text = text.replace(/{female_leadership}/g, formatNumber(femaleLeadership.value))
  text = text.replace(/{male_ratio}/g, formatNumber(maleRatio.value))
  text = text.replace(/{female_ratio}/g, formatNumber(femaleRatio.value))
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
.dei-detail {
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.02) 0%, rgba(236, 72, 153, 0.02) 100%);
  border-radius: 0.75rem;
}

// Narrative Section
.narrative-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%);
  border-radius: 0.5rem;
  border-left: 4px solid #a855f7;

  [dir='rtl'] & {
    border-left: none;
    border-right: 4px solid #a855f7;
  }

  .narrative-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #6b21a8;
    margin: 0 0 0.75rem 0;
  }

  .narrative-body {
    margin: 0;
    color: #6b21a8;
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
  border: 1px solid #f3e8ff;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.2);
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
    color: #6b21a8;
    margin-bottom: 0.25rem;

    &.positive {
      color: #10b981;
    }

    &.warning {
      color: #ef4444;
    }
  }

  .metric-unit {
    font-size: 0.8rem;
    color: #a855f7;
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
  border: 1px solid #f3e8ff;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.05);

  .chart-title {
    font-size: 1rem;
    font-weight: 600;
    color: #6b21a8;
    margin: 0 0 1rem 0;
  }

  .bar-chart {
    width: 100%;
    height: auto;
    min-height: 280px;
    margin-bottom: 1rem;
  }
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;

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

// Heatmap Container
.heatmap-container {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #f3e8ff;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.05);
  overflow-x: auto;

  .chart-title {
    font-size: 1rem;
    font-weight: 600;
    color: #6b21a8;
    margin: 0 0 1rem 0;
  }

  .heatmap {
    width: 100%;
    height: auto;
    min-height: 300px;
  }
}

.heatmap-legend {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
  flex-wrap: wrap;

  .legend-row {
    display: flex;
    gap: 0.5rem;
  }

  .legend-cell {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 2px;
    }

    .legend-label {
      color: #64748b;
      font-weight: 500;
    }
  }
}

// Progress Container
.progress-container {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #f3e8ff;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.05);

  .chart-title {
    font-size: 1rem;
    font-weight: 600;
    color: #6b21a8;
    margin: 0 0 1.5rem 0;
  }

  .progress-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    .progress-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #6b21a8;
      flex: 1;
    }

    .progress-percentage {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .progress-bar {
    width: 100%;
    height: auto;
  }
}

// Controls Table Section
.controls-table-section {
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #f3e8ff;

  .section-title {
    font-size: 1rem;
    font-weight: 600;
    color: #6b21a8;
    margin: 0 0 1rem 0;
  }
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #f3e8ff;

  .controls-table {
    width: 100%;
    border-collapse: collapse;
    background: white;

    thead {
      background: linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%);
      position: sticky;
      top: 0;

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #6b21a8;
        border-bottom: 2px solid #a855f7;
        font-size: 0.9rem;
        white-space: nowrap;

        [dir='rtl'] & {
          text-align: right;
        }
      }
    }

    tbody {
      tr {
        border-bottom: 1px solid #f3e8ff;
        transition: background-color 0.2s ease;

        &:hover {
          background: #faf5ff;
        }

        td {
          padding: 1rem;
          color: #475569;
          font-size: 0.9rem;

          &.title-cell {
            font-weight: 600;
            color: #6b21a8;
            max-width: 200px;
            word-wrap: break-word;
          }

          &.value-cell {
            font-weight: 600;
            color: #a855f7;
          }

          &.code-cell {
            font-family: 'Courier New', monospace;
            color: #a855f7;
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
              background: #f3e8ff;
              color: #6b21a8;
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
  .dei-detail {
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

  .heatmap-container,
  .progress-container,
  .controls-table-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .progress-items {
    grid-template-columns: 1fr;
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
