<template>
  <div class="board-detail">
    <!-- Narrative Section -->
    <div v-if="narrative" class="narrative-section">
      <h3 class="narrative-title">{{ narrative.title }}</h3>
      <p class="narrative-body">{{ narrative.body }}</p>
    </div>

    <!-- Metric Cards -->
    <div class="metrics-grid">
      <!-- Board Size Card -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">👥</span>
          <h4 class="metric-label">{{ t('esg.governance.board_size') }}</h4>
        </div>
        <div class="metric-value">{{ metadata?.board_size || '-' }}</div>
        <div class="metric-unit">{{ t('esg.governance.members') }}</div>
      </div>

      <!-- Female Members Card -->
      <div class="metric-card" :class="{ 'high-value': (metadata?.female_percentage || 0) >= 40, 'medium-value': (metadata?.female_percentage || 0) >= 25, 'low-value': (metadata?.female_percentage || 0) < 25 }">
        <div class="metric-header">
          <span class="metric-icon">👩‍💼</span>
          <h4 class="metric-label">{{ t('esg.governance.female_members') }}</h4>
        </div>
        <div class="metric-value">{{ formatNumber(metadata?.female_percentage) || '-' }}<span class="metric-percentage">%</span></div>
        <div class="metric-unit">{{ t('esg.governance.percentage') }}</div>
      </div>

      <!-- Meeting Attendance Card -->
      <div class="metric-card" :class="{ 'high-value': (metadata?.meeting_attendance || 0) >= 90, 'medium-value': (metadata?.meeting_attendance || 0) >= 80, 'low-value': (metadata?.meeting_attendance || 0) < 80 }">
        <div class="metric-header">
          <span class="metric-icon">✓</span>
          <h4 class="metric-label">{{ t('esg.governance.meeting_attendance') }}</h4>
        </div>
        <div class="metric-value">{{ formatNumber(metadata?.meeting_attendance) || '-' }}<span class="metric-percentage">%</span></div>
        <div class="metric-unit">{{ t('esg.governance.attendance_rate') }}</div>
      </div>

      <!-- ESG Meetings Card -->
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-icon">🌱</span>
          <h4 class="metric-label">{{ t('esg.governance.esg_meetings') }}</h4>
        </div>
        <div class="metric-value">{{ metadata?.esg_meetings_count || '-' }}</div>
        <div class="metric-unit">{{ t('esg.governance.meetings') }}</div>
      </div>
    </div>

    <!-- Charts Grid -->
    <div class="charts-grid">
      <!-- Board Composition (Gender) -->
      <div class="chart-card">
        <h4 class="chart-title">{{ t('esg.governance.board_composition_gender') }}</h4>
        <svg v-if="metadata?.gender_breakdown" viewBox="0 0 120 120" class="pie-chart">
          <circle v-for="(item, idx) in genderBreakdownCharts" :key="`gender-${idx}`" 
            :cx="60" :cy="60" :r="45" 
            :stroke="item.color" 
            :stroke-width="10"
            fill="none"
            :stroke-dasharray="`${item.dasharray} ${item.dashoffset}`"
            :stroke-dashoffset="`-${item.offset}`"
            class="pie-segment"
          />
          <circle cx="60" cy="60" r="30" fill="white" />
          <text x="60" y="65" text-anchor="middle" class="pie-label">
            {{ metadata?.board_size || 0 }}
          </text>
          <text x="60" y="75" text-anchor="middle" class="pie-sublabel">
            {{ t('esg.governance.members') }}
          </text>
        </svg>
        <div v-else class="chart-empty">{{ t('common.no_data') }}</div>
        <div v-if="metadata?.gender_breakdown" class="legend">
          <div v-for="(value, key) in metadata.gender_breakdown" :key="key" class="legend-item">
            <span class="legend-color" :style="{ backgroundColor: getGenderColor(key) }"></span>
            <span class="legend-label">{{ key }}: {{ value }}%</span>
          </div>
        </div>
      </div>

      <!-- Meeting Frequency -->
      <div class="chart-card">
        <h4 class="chart-title">{{ t('esg.governance.meeting_frequency') }}</h4>
        <svg v-if="metadata?.meeting_frequency" viewBox="0 0 300 150" class="bar-chart">
          <!-- Y-axis -->
          <line x1="40" y1="20" x2="40" y2="120" stroke="#d1d5db" stroke-width="1" />
          <!-- X-axis -->
          <line x1="40" y1="120" x2="280" y2="120" stroke="#d1d5db" stroke-width="1" />
          
          <!-- Bars -->
          <g v-for="(item, idx) in meetingFrequencyBars" :key="`bar-${idx}`">
            <rect :x="item.x" :y="item.y" :width="item.width" :height="item.height" :fill="item.color" class="bar" />
            <text :x="item.x + item.width / 2" :y="135" text-anchor="middle" class="bar-label">{{ item.label }}</text>
            <text :x="item.x + item.width / 2" :y="item.y - 5" text-anchor="middle" class="bar-value">{{ item.value }}</text>
          </g>
        </svg>
        <div v-else class="chart-empty">{{ t('common.no_data') }}</div>
      </div>

      <!-- Committee Overview -->
      <div class="chart-card">
        <h4 class="chart-title">{{ t('esg.governance.committee_overview') }}</h4>
        <div v-if="metadata?.committees && metadata.committees.length > 0" class="committee-list">
          <div v-for="(committee, idx) in metadata.committees" :key="`committee-${idx}`" class="committee-item">
            <span class="committee-name">{{ committee.name }}</span>
            <span class="committee-members">{{ committee.member_count || 0 }}</span>
          </div>
        </div>
        <div v-else class="chart-empty">{{ t('common.no_data') }}</div>
      </div>
    </div>

    <!-- Board Members List (if available) -->
    <div v-if="metadata?.board_members && metadata.board_members.length > 0" class="board-members-section">
      <h4 class="section-title">{{ t('esg.governance.board_members') }}</h4>
      <div class="members-grid">
        <div v-for="(member, idx) in metadata.board_members.slice(0, 9)" :key="`member-${idx}`" class="member-card">
          <div class="member-avatar">{{ getMemberInitials(member.name) }}</div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-role">{{ member.role }}</div>
            <div class="member-gender">{{ member.gender }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls Table -->
    <div v-if="controls && controls.length > 0" class="controls-section">
      <h4 class="section-title">{{ t('esg.governance.board_controls') }}</h4>
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
    board_size?: number
    female_percentage?: number
    meeting_attendance?: number
    esg_meetings_count?: number
    gender_breakdown?: Record<string, number>
    meeting_frequency?: Record<string, number>
    committees?: Array<{ name: string; member_count: number }>
    board_members?: Array<{ name: string; role: string; gender: string }>
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

// Get gender color mapping
const getGenderColor = (gender: string): string => {
  const colors: Record<string, string> = {
    'Male': '#3b82f6',
    'Female': '#ec4899',
    'مرد': '#3b82f6',
    'زن': '#ec4899',
  }
  return colors[gender] || '#6b7280'
}

// Gender breakdown pie chart data
const genderBreakdownCharts = computed(() => {
  if (!props.metadata?.gender_breakdown) return []
  
  const data = Object.entries(props.metadata.gender_breakdown)
  const circumference = 2 * Math.PI * 45
  let offset = 0
  
  return data.map(([key, percentage]) => {
    const dasharray = (percentage / 100) * circumference
    const dashoffset = circumference
    const result = {
      color: getGenderColor(key),
      dasharray: dasharray.toFixed(2),
      dashoffset: (circumference - dasharray).toFixed(2),
      offset: offset.toFixed(2),
    }
    offset += dasharray
    return result
  })
})

// Meeting frequency bar chart data
const meetingFrequencyBars = computed(() => {
  if (!props.metadata?.meeting_frequency) return []
  
  const data = Object.entries(props.metadata.meeting_frequency)
  const maxValue = Math.max(...data.map(([_, v]) => v as number))
  const chartHeight = 100
  const barWidth = 40
  const spacing = 60
  
  return data.map(([label, value], idx) => ({
    x: 50 + idx * spacing,
    y: 120 - (value as number / maxValue) * chartHeight,
    width: barWidth,
    height: (value as number / maxValue) * chartHeight,
    label,
    value: (value as number).toFixed(0),
    color: '#2563eb',
  }))
})

// Get member initials
const getMemberInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n.charAt(0).toUpperCase())
    .join('')
}
</script>

<style scoped lang="scss">
.board-detail {
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

// Pie Chart
.pie-chart {
  width: 100%;
  height: 160px;
  margin-bottom: 1rem;

  .pie-segment {
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  .pie-label {
    font-size: 18px;
    font-weight: 700;
    fill: #1e40af;
  }

  .pie-sublabel {
    font-size: 10px;
    fill: #64748b;
  }
}

// Bar Chart
.bar-chart {
  width: 100%;
  height: 160px;

  .bar {
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
      filter: brightness(0.9);
    }
  }

  .bar-label {
    font-size: 11px;
    fill: #64748b;
    font-weight: 500;
  }

  .bar-value {
    font-size: 12px;
    fill: #1e40af;
    font-weight: 600;
  }
}

// Legend
.legend {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #475569;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .legend-label {
    word-break: break-word;
  }
}

// Committee List
.committee-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.committee-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  font-size: 0.9rem;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  .committee-name {
    font-weight: 500;
    color: #1e40af;
  }

  .committee-members {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: #dbeafe;
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: 600;
    color: #1e40af;
  }
}

// Board Members Section
.board-members-section {
  padding-top: 1rem;
  border-top: 1px solid #dbeafe;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 1rem 0;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.member-card {
  padding: 1rem;
  background: #f8fafc;
  border: 1px solid #dbeafe;
  border-radius: 0.5rem;
  text-align: center;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
    transform: translateY(-2px);
  }

  .member-avatar {
    width: 48px;
    height: 48px;
    margin: 0 auto 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    color: white;
    border-radius: 50%;
    font-weight: 700;
    font-size: 1rem;
  }

  .member-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .member-name {
      font-weight: 600;
      color: #1e40af;
      font-size: 0.9rem;
      word-break: break-word;
    }

    .member-role {
      font-size: 0.8rem;
      color: #475569;
    }

    .member-gender {
      font-size: 0.75rem;
      color: #94a3b8;
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
  .board-detail {
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
