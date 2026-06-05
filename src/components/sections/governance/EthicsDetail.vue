<template>
  <div class="ethics-detail">
    <!-- Narrative Section -->
    <div v-if="narrative" class="narrative-section">
      <h3 class="narrative-title">{{ narrative.title }}</h3>
      <p class="narrative-body">{{ narrative.body }}</p>
    </div>

    <!-- Metric Cards -->
    <div class="metrics-grid">
      <!-- Code of Conduct Coverage Card -->
      <div class="metric-card" :class="{ 'high-value': (metadata?.code_of_conduct_coverage || 0) >= 90, 'medium-value': (metadata?.code_of_conduct_coverage || 0) >= 70, 'low-value': (metadata?.code_of_conduct_coverage || 0) < 70 }">
        <div class="metric-header">
          <span class="metric-icon">📋</span>
          <h4 class="metric-label">{{ t('esg.governance.code_of_conduct') }}</h4>
        </div>
        <div class="metric-value">{{ formatNumber(metadata?.code_of_conduct_coverage) || '-' }}<span class="metric-percentage">%</span></div>
        <div class="metric-unit">{{ t('esg.governance.coverage') }}</div>
      </div>

      <!-- Compliance Training Card -->
      <div class="metric-card" :class="{ 'high-value': (metadata?.compliance_training || 0) >= 80, 'medium-value': (metadata?.compliance_training || 0) >= 60, 'low-value': (metadata?.compliance_training || 0) < 60 }">
        <div class="metric-header">
          <span class="metric-icon">📚</span>
          <h4 class="metric-label">{{ t('esg.governance.compliance_training') }}</h4>
        </div>
        <div class="metric-value">{{ formatNumber(metadata?.compliance_training) || '-' }}<span class="metric-percentage">%</span></div>
        <div class="metric-unit">{{ t('esg.governance.completion') }}</div>
      </div>

      <!-- Ethical Violations Card -->
      <div class="metric-card" :class="{ 'high-value': (metadata?.ethical_violations || 0) === 0, 'medium-value': (metadata?.ethical_violations || 0) <= 3, 'low-value': (metadata?.ethical_violations || 0) > 3 }">
        <div class="metric-header">
          <span class="metric-icon">⚠️</span>
          <h4 class="metric-label">{{ t('esg.governance.ethical_violations') }}</h4>
        </div>
        <div class="metric-value">{{ metadata?.ethical_violations || 0 }}</div>
        <div class="metric-unit">{{ t('esg.governance.incidents') }}</div>
      </div>

      <!-- Whistleblower Reports Card -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">🔔</span>
          <h4 class="metric-label">{{ t('esg.governance.whistleblower_reports') }}</h4>
        </div>
        <div class="metric-value">{{ metadata?.whistleblower_reports || 0 }}</div>
        <div class="metric-unit">{{ t('esg.governance.reports') }}</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Compliance Metrics Progress -->
      <div class="chart-card">
        <h4 class="chart-title">{{ t('esg.governance.compliance_progress') }}</h4>
        <div v-if="metadata?.compliance_metrics" class="progress-metrics">
          <div v-for="(item, idx) in complianceMetricsItems" :key="`metric-${idx}`" class="progress-item">
            <div class="progress-header">
              <span class="progress-label">{{ item.label }}</span>
              <span class="progress-value">{{ item.value }}%</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: `${item.value}%`, backgroundColor: item.color }"></div>
            </div>
          </div>
        </div>
        <div v-else class="chart-empty">{{ t('common.no_data') }}</div>
      </div>

      <!-- Training Completion Gauge -->
      <div class="chart-card">
        <h4 class="chart-title">{{ t('esg.governance.training_completion') }}</h4>
        <svg v-if="metadata?.compliance_training !== undefined" viewBox="0 0 120 120" class="gauge-chart">
          <!-- Background arc -->
          <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" stroke-width="8" stroke-dasharray="141.37 0" stroke-dashoffset="0" class="gauge-bg" />
          <!-- Progress arc -->
          <circle cx="60" cy="60" r="45" fill="none" :stroke="getTrainingColor(metadata.compliance_training)" stroke-width="8" 
            :stroke-dasharray="`${gaugeArcLength} 141.37`" stroke-dashoffset="0" class="gauge-progress" 
            transform="rotate(-90 60 60)" />
          <!-- Center circle -->
          <circle cx="60" cy="60" r="30" fill="white" stroke="#e5e7eb" stroke-width="1" />
          <!-- Value text -->
          <text x="60" y="60" text-anchor="middle" dominant-baseline="middle" class="gauge-value">
            {{ formatNumber(metadata?.compliance_training) || '-' }}%
          </text>
        </svg>
        <div v-else class="chart-empty">{{ t('common.no_data') }}</div>
      </div>

      <!-- Incident Timeline -->
      <div class="chart-card">
        <h4 class="chart-title">{{ t('esg.governance.incident_timeline') }}</h4>
        <svg v-if="metadata?.incident_timeline" viewBox="0 0 300 150" class="timeline-chart">
          <!-- Timeline line -->
          <line x1="40" y1="80" x2="280" y2="80" stroke="#d1d5db" stroke-width="2" />
          
          <!-- Timeline points -->
          <g v-for="(item, idx) in incidentTimelinePoints" :key="`point-${idx}`">
            <!-- Vertical connector -->
            <line :x1="item.x" :y1="80" :x2="item.x" :y2="item.y" stroke="#d1d5db" stroke-width="1" />
            <!-- Point circle -->
            <circle :cx="item.x" :cy="item.y" :r="5" :fill="item.color" class="timeline-point" />
            <!-- Label -->
            <text :x="item.x" :y="item.labelY" text-anchor="middle" class="timeline-label">{{ item.label }}</text>
            <!-- Value -->
            <text :x="item.x" :y="item.valueY" text-anchor="middle" class="timeline-value">{{ item.value }}</text>
          </g>
        </svg>
        <div v-else class="chart-empty">{{ t('common.no_data') }}</div>
      </div>
    </div>

    <!-- Ethics Framework Details -->
    <div v-if="metadata?.ethics_frameworks && metadata.ethics_frameworks.length > 0" class="ethics-frameworks-section">
      <h4 class="section-title">{{ t('esg.governance.ethics_frameworks') }}</h4>
      <div class="frameworks-grid">
        <div v-for="(framework, idx) in metadata.ethics_frameworks" :key="`framework-${idx}`" class="framework-card">
          <div class="framework-header">
            <span class="framework-icon">✓</span>
            <span class="framework-name">{{ framework.name }}</span>
          </div>
          <div class="framework-details">
            <div v-if="framework.adoption_year" class="detail-item">
              <span class="detail-label">{{ t('esg.governance.adoption_year') }}:</span>
              <span class="detail-value">{{ framework.adoption_year }}</span>
            </div>
            <div v-if="framework.coverage" class="detail-item">
              <span class="detail-label">{{ t('esg.governance.coverage') }}:</span>
              <span class="detail-value">{{ framework.coverage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Table -->
    <div v-if="controls && controls.length > 0" class="controls-section">
      <h4 class="section-title">{{ t('esg.governance.ethics_controls') }}</h4>
      <div class="table-responsive">
        <table class="controls-table">
          <thead>
            <tr>
              <th>{{ t('common.title') }}</th>
              <th>{{ t('common.answer') }}</th>
              <th>{{ t('common.unit') }}</th>
              <th>{{ t('common.metric_code') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="control in controls" :key="control.id" class="control-row">
              <td class="col-title">{{ control.title }}</td>
              <td class="col-answer">{{ control.answer !== null && control.answer !== undefined ? control.answer : '-' }}</td>
              <td class="col-unit">{{ control.unit || '-' }}</td>
              <td class="col-code">{{ control.metric_code || '-' }}</td>
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

interface Control {
  id: string
  title: string
  answer: any
  unit?: string
  metric_code?: string
  frameworks?: string[]
}

interface Props {
  narrative?: {
    title: string
    body: string
  }
  metadata?: {
    code_of_conduct_coverage?: number
    compliance_training?: number
    ethical_violations?: number
    whistleblower_reports?: number
    compliance_metrics?: Record<string, number>
    incident_timeline?: Record<string, number>
    ethics_frameworks?: Array<{ name: string; adoption_year?: number; coverage?: number }>
    [key: string]: any
  }
  controls?: Control[]
}

const props = defineProps<Props>()

const { t, locale } = useI18n()

// Format number based on locale
const formatNumber = (value: any): string => {
  if (value === null || value === undefined) return '-'
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return '-'
  
  return new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(num)
}

// Get training color based on completion percentage
const getTrainingColor = (training: number): string => {
  if (training >= 80) return '#10b981'
  if (training >= 60) return '#f59e0b'
  return '#ef4444'
}

// Gauge arc length calculation
const gaugeArcLength = computed(() => {
  if (!props.metadata?.compliance_training) return 0
  const percentage = props.metadata.compliance_training
  return (percentage / 100) * 141.37
})

// Compliance metrics items
const complianceMetricsItems = computed(() => {
  if (!props.metadata?.compliance_metrics) return []
  
  return Object.entries(props.metadata.compliance_metrics).map(([key, value]) => ({
    label: key,
    value: value as number,
    color: (value as number) >= 80 ? '#10b981' : (value as number) >= 60 ? '#f59e0b' : '#ef4444',
  }))
})

// Incident timeline points
const incidentTimelinePoints = computed(() => {
  if (!props.metadata?.incident_timeline) return []
  
  const data = Object.entries(props.metadata.incident_timeline)
  const spacing = 240 / (data.length - 1 || 1)
  
  return data.map(([label, value], idx) => {
    const x = 40 + idx * spacing
    const isEven = idx % 2 === 0
    const y = isEven ? 50 : 110
    const labelY = isEven ? 35 : 135
    const valueY = isEven ? 20 : 150
    
    return {
      x,
      y,
      label,
      value: (value as number),
      labelY,
      valueY,
      color: (value as number) > 0 ? '#ef4444' : '#d1d5db',
    }
  })
})

// Props definitions must come after computed properties
defineProps<Props>()
</script>

<style scoped lang="scss">
.ethics-detail {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

// Narrative Section
.narrative-section {
  padding: 1.5rem;
  background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
  border-radius: 0.5rem;
  border-left: 3px solid #2563eb;

  [dir='rtl'] & {
    border-left: none;
    border-right: 3px solid #2563eb;
  }

  .narrative-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 0.5rem 0;
  }

  .narrative-body {
    margin: 0;
    color: #1e3a8a;
    line-height: 1.6;
    font-size: 0.9rem;
  }
}

// Metrics Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  padding: 1.25rem;
  background: white;
  border: 1px solid #dbeafe;
  border-radius: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    transform: translateY(-2px);
  }

  &.high-value {
    border-left: 3px solid #10b981;
    [dir='rtl'] & {
      border-left: none;
      border-right: 3px solid #10b981;
    }
  }

  &.medium-value {
    border-left: 3px solid #f59e0b;
    [dir='rtl'] & {
      border-left: none;
      border-right: 3px solid #f59e0b;
    }
  }

  &.low-value {
    border-left: 3px solid #ef4444;
    [dir='rtl'] & {
      border-left: none;
      border-right: 3px solid #ef4444;
    }
  }

  .metric-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;

    [dir='rtl'] & {
      flex-direction: row-reverse;
    }

    .metric-icon {
      font-size: 1.5rem;
    }

    .metric-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }
  }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1e40af;
    margin: 0.5rem 0;
    display: flex;
    align-items: flex-start;

    .metric-percentage {
      font-size: 1.25rem;
      margin-left: 0.25rem;

      [dir='rtl'] & {
        margin-left: 0;
        margin-right: 0.25rem;
      }
    }
  }

  .metric-unit {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
  }
}

// Charts Grid
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  padding: 1.5rem;
  background: white;
  border: 1px solid #dbeafe;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.05);

  .chart-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1e40af;
    margin: 0 0 1rem 0;
  }

  .chart-empty {
    padding: 2rem 1rem;
    text-align: center;
    color: #94a3b8;
    font-size: 0.9rem;
  }
}

// Progress Metrics
.progress-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;

    [dir='rtl'] & {
      flex-direction: row-reverse;
    }

    .progress-label {
      font-weight: 500;
      color: #475569;
    }

    .progress-value {
      font-weight: 600;
      color: #1e40af;
    }
  }

  .progress-bar-bg {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;

    .progress-bar-fill {
      height: 100%;
      transition: width 0.3s ease;
      border-radius: 4px;
    }
  }
}

// Gauge Chart
.gauge-chart {
  width: 100%;
  height: 160px;

  .gauge-bg {
    opacity: 0.3;
  }

  .gauge-progress {
    transition: stroke-dasharray 0.5s ease;
  }

  .gauge-value {
    font-size: 18px;
    font-weight: 700;
    fill: #1e40af;
  }
}

// Timeline Chart
.timeline-chart {
  width: 100%;
  height: 160px;

  .timeline-point {
    transition: r 0.3s ease;
    cursor: pointer;

    &:hover {
      r: 7;
    }
  }

  .timeline-label {
    font-size: 11px;
    fill: #64748b;
    font-weight: 500;
  }

  .timeline-value {
    font-size: 12px;
    fill: #1e40af;
    font-weight: 600;
  }
}

// Ethics Frameworks Section
.ethics-frameworks-section {
  padding-top: 1rem;
  border-top: 1px solid #dbeafe;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 1rem 0;
}

.frameworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.framework-card {
  padding: 1rem;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    transform: translateY(-2px);
  }

  .framework-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;

    [dir='rtl'] & {
      flex-direction: row-reverse;
    }

    .framework-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #10b981;
      color: white;
      border-radius: 50%;
      font-size: 0.8rem;
      flex-shrink: 0;
    }

    .framework-name {
      font-weight: 600;
      color: #1e40af;
      font-size: 0.95rem;
    }
  }

  .framework-details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;

    [dir='rtl'] & {
      flex-direction: row-reverse;
    }

    .detail-label {
      color: #64748b;
      font-weight: 500;
    }

    .detail-value {
      color: #1e40af;
      font-weight: 600;
    }
  }
}

// Controls Section
.controls-section {
  padding-top: 1rem;
  border-top: 1px solid #dbeafe;
}

.table-responsive {
  overflow-x: auto;
  border-radius: 0.5rem;
  border: 1px solid #dbeafe;
}

.controls-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;

  thead {
    background: linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%);
    position: sticky;
    top: 0;
    z-index: 10;

    th {
      padding: 1rem 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #1e40af;
      border-bottom: 2px solid #bfdbfe;

      [dir='rtl'] & {
        text-align: right;
      }
    }
  }

  tbody {
    tr {
      transition: background-color 0.2s ease;
      border-bottom: 1px solid #dbeafe;

      &:hover {
        background-color: #f0f9ff;
      }

      td {
        padding: 0.75rem;
        color: #1e3a8a;

        &.col-title {
          font-weight: 500;
          max-width: 200px;
          word-break: break-word;
        }

        &.col-answer {
          font-weight: 600;
          color: #2563eb;
        }

        &.col-unit,
        &.col-code {
          font-size: 0.85rem;
          color: #64748b;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .ethics-detail {
    gap: 1.5rem;
  }

  .charts-grid {
    gap: 1rem;
  }

  .chart-card {
    padding: 1rem;
  }

  .controls-table {
    font-size: 0.8rem;

    thead th {
      padding: 0.75rem 0.5rem;
    }

    tbody td {
      padding: 0.5rem;
    }
  }
}
</style>
