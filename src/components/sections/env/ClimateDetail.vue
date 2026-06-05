<template>
  <div class="climate-detail" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Narrative Section -->
    <div class="narrative-section">
      <h2 class="narrative-title">
        {{ narrativeData?.title || $t('environmental.climate.detailTitle') || 'تغییرات اقلیمی و استراتژی اقلیمی' }}
      </h2>
      <p v-if="narrativeData?.body" class="narrative-body">
        {{ interpolateNarrative(narrativeData.body) }}
      </p>
      <p v-else class="narrative-empty">
        {{ $t('environmental.climate.noNarrative') || 'No narrative available' }}
      </p>
    </div>

    <!-- Charts Section -->
    <div v-if="hasChartData" class="charts-section">
      <div class="charts-grid">
        <!-- Investment Progress -->
        <div v-if="climateData.investment !== undefined" class="chart-card">
          <h3 class="chart-title">{{ $t('climate.investmentTitle') || 'Investment Amount' }}</h3>
          <div class="progress-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${getPercentage(climateData.investment, 1000000)}%` }"
              ></div>
            </div>
            <div class="progress-label">
              <span class="progress-value">{{ formatCurrency(climateData.investment) }}</span>
            </div>
          </div>
        </div>

        <!-- Goal Achievement -->
        <div v-if="climateData.goal_achievement !== undefined" class="chart-card">
          <h3 class="chart-title">{{ $t('climate.goalAchievementTitle') || 'Goal Achievement' }}</h3>
          <div class="circular-progress">
            <svg viewBox="0 0 120 120" class="circular-svg">
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                class="circle-background"
              />
              <circle 
                cx="60" 
                cy="60" 
                r="54" 
                class="circle-progress"
                :style="{ strokeDashoffset: getCircleProgress(climateData.goal_achievement) }"
              />
            </svg>
            <div class="progress-text">
              <span class="progress-percentage">{{ Math.round(climateData.goal_achievement) }}%</span>
            </div>
          </div>
        </div>

        <!-- Climate Risks -->
        <div v-if="climateData.risks_identified !== undefined" class="chart-card">
          <h3 class="chart-title">{{ $t('climate.risksTitle') || 'Climate Risks Identified' }}</h3>
          <div class="risk-display">
            <div class="risk-number">{{ climateData.risks_identified }}</div>
            <div class="risk-label">{{ $t('climate.risksLabel') || 'Risks' }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Controls List Section -->
    <div v-if="groupedControls.length > 0" class="controls-section">
      <h3 class="section-title">{{ $t('climate.controlsTitle') || 'Climate Controls' }}</h3>
      
      <div v-for="group in groupedControls" :key="group.metric_code" class="control-group">
        <div class="group-header">
          <span class="metric-code">{{ group.metric_code }}</span>
          <span class="group-count">{{ group.controls.length }} {{ $t('climate.item') || 'item' }}</span>
        </div>
        
        <div class="controls-list">
          <div v-for="(control, idx) in group.controls" :key="`${group.metric_code}-${idx}`" class="control-item">
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
    <div v-if="climateControls.length > 0" class="table-section">
      <h3 class="section-title">{{ $t('climate.tableTitle') || 'Complete Climate Controls' }}</h3>
      
      <div class="table-wrapper">
        <table class="climate-table">
          <thead>
            <tr>
              <th>{{ $t('climate.col.title') || 'Title' }}</th>
              <th>{{ $t('climate.col.answer') || 'Answer' }}</th>
              <th>{{ $t('climate.col.unit') || 'Unit' }}</th>
              <th>{{ $t('climate.col.metricCode') || 'Metric Code' }}</th>
              <th>{{ $t('climate.col.frameworks') || 'Frameworks' }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(control, idx) in climateControls" :key="idx">
              <td class="cell-title">{{ control.title }}</td>
              <td class="cell-answer">{{ control.answer }}</td>
              <td class="cell-unit">{{ control.unit || '-' }}</td>
              <td class="cell-code">{{ control.metric_code }}</td>
              <td class="cell-frameworks">
                <div v-if="control.frameworks && control.frameworks.length" class="frameworks-list">
                  <span 
                    v-for="(fw, fwIdx) in control.frameworks" 
                    :key="fwIdx"
                    class="framework-badge"
                  >
                    {{ fw }}
                  </span>
                </div>
                <span v-else class="frameworks-empty">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!hasContent" class="empty-state">
      <div class="empty-icon">📋</div>
      <p>{{ $t('climate.noData') || 'No climate data available' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ReportData } from '@/core/services/reportService';

// ============================================================================
// Types
// ============================================================================

interface ClimateControl {
  title: string;
  answer: string | number;
  unit?: string;
  metric_code?: string;
  frameworks?: string[];
}

interface ClimateData {
  investment?: number;
  goal_achievement?: number;
  risks_identified?: number;
  controls?: ClimateControl[];
}

interface NarrativeData {
  title?: string;
  body?: string;
}

interface ControlGroup {
  metric_code: string;
  controls: ClimateControl[];
}

// ============================================================================
// Props
// ============================================================================

interface Props {
  report: ReportData;
}

const props = defineProps<Props>();

// ============================================================================
// Composition
// ============================================================================

const { locale } = useI18n();

// ============================================================================
// Computed
// ============================================================================

const isRTL = computed(() => locale.value === 'fa');

const climateData = computed<ClimateData>(() => {
  const env = props.report.environmental as any;
  if (typeof env?.climate === 'object' && env.climate !== null) {
    return env.climate as ClimateData;
  }
  return {};
});

const narrativeData = computed<NarrativeData>(() => {
  const narratives = props.report.narratives as any;
  if (narratives?.environmental?.climate) {
    if (typeof narratives.environmental.climate === 'object') {
      return narratives.environmental.climate as NarrativeData;
    }
    // Fallback if climate is a string
    return { body: narratives.environmental.climate as string };
  }
  return {};
});

const climateControls = computed<ClimateControl[]>(() => {
  return climateData.value.controls || [];
});

const groupedControls = computed<ControlGroup[]>(() => {
  const groups: Record<string, ClimateControl[]> = {};
  
  climateControls.value.forEach(control => {
    const code = control.metric_code || 'UNGROUPED';
    if (!groups[code]) {
      groups[code] = [];
    }
    groups[code].push(control);
  });

  return Object.entries(groups).map(([metric_code, controls]) => ({
    metric_code,
    controls,
  }));
});

const hasChartData = computed(() => {
  return (
    climateData.value.investment !== undefined ||
    climateData.value.goal_achievement !== undefined ||
    climateData.value.risks_identified !== undefined
  );
});

const hasContent = computed(() => {
  return (
    hasChartData.value ||
    climateControls.value.length > 0 ||
    narrativeData.value.title ||
    narrativeData.value.body
  );
});

// ============================================================================
// Methods
// ============================================================================

const getPercentage = (value: number, max: number = 100): number => {
  return Math.min(100, Math.max(0, (value / max) * 100));
};

const getCircleProgress = (percentage: number): number => {
  const circumference = 2 * Math.PI * 54;
  return circumference - (percentage / 100) * circumference;
};

const formatCurrency = (value: number): string => {
  if (locale.value === 'fa') {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

const interpolateNarrative = (narrative: string): string => {
  let result = narrative;
  
  if (climateData.value.investment !== undefined) {
    result = result.replace(
      /\{investment\}/g,
      formatCurrency(climateData.value.investment)
    );
  }
  
  if (climateData.value.goal_achievement !== undefined) {
    result = result.replace(
      /\{goal_achievement\}/g,
      `${Math.round(climateData.value.goal_achievement)}%`
    );
  }
  
  if (climateData.value.risks_identified !== undefined) {
    result = result.replace(
      /\{risks_identified\}/g,
      String(climateData.value.risks_identified)
    );
  }
  
  return result;
};
</script>

<style scoped lang="css">
/* ============================================================================
   Container
   ============================================================================ */

.climate-detail {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  width: 100%;
  padding: 0;
}

/* ============================================================================
   Narrative Section
   ============================================================================ */

.narrative-section {
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border: 1px solid #d1fae5;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.narrative-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  letter-spacing: -0.01em;
}

.narrative-body {
  font-size: 1rem;
  line-height: 1.7;
  color: #4b5563;
  margin: 0;
  white-space: pre-wrap;
}

.narrative-empty {
  font-size: 0.95rem;
  color: #9ca3af;
  font-style: italic;
  margin: 0;
}

/* ============================================================================
   Charts Section
   ============================================================================ */

.charts-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.chart-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  transform: translateY(-2px);
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.25rem 0;
}

/* Progress Bar */
.progress-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-bar {
  width: 100%;
  height: 32px;
  background: #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  width: 65%;
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.75rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.progress-value {
  font-weight: 600;
  color: #10b981;
}

/* Circular Progress */
.circular-progress {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.circular-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.circle-background {
  fill: none;
  stroke: #e5e7eb;
  stroke-width: 8;
}

.circle-progress {
  fill: none;
  stroke: url(#circleGradient);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
  stroke-dasharray: 339.29;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.progress-percentage {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #10b981;
}

/* Risk Display */
.risk-display {
  text-align: center;
  padding: 1rem;
}

.risk-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #ef4444;
  line-height: 1;
}

.risk-label {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

/* ============================================================================
   Controls Section
   ============================================================================ */

.controls-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.control-group {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.group-header {
  background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%);
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: #059669;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.group-count {
  font-size: 0.8rem;
  color: #6b7280;
}

.controls-list {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.control-item {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.2s;
}

.control-item:last-child {
  border-bottom: none;
}

.control-item:hover {
  background: #fafbfc;
}

.control-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1f2937;
}

.control-answer {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.answer-value {
  font-weight: 600;
  color: #10b981;
}

.answer-unit {
  color: #6b7280;
  font-size: 0.8rem;
}

/* ============================================================================
   Table Section
   ============================================================================ */

.table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.climate-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.climate-table thead {
  background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%);
  border-bottom: 2px solid #e5e7eb;
}

.climate-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1f2937;
  letter-spacing: 0.5px;
}

.climate-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.2s;
}

.climate-table tbody tr:hover {
  background: #fafbfc;
}

.climate-table tbody tr:last-child {
  border-bottom: none;
}

.climate-table td {
  padding: 1rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.cell-title {
  font-weight: 500;
  color: #1f2937;
  max-width: 250px;
}

.cell-answer {
  font-weight: 600;
  color: #10b981;
}

.cell-unit {
  color: #6b7280;
  font-size: 0.85rem;
}

.cell-code {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  color: #059669;
  background: rgba(16, 185, 129, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  width: fit-content;
}

.cell-frameworks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.frameworks-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.framework-badge {
  display: inline-block;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.frameworks-empty {
  color: #9ca3af;
}

/* ============================================================================
   Empty State
   ============================================================================ */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  background: #f9fafb;
  border: 2px dashed #e5e7eb;
  border-radius: 10px;
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
}

.empty-state p {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

/* ============================================================================
   Responsive Design
   ============================================================================ */

/* Tablet */
@media (max-width: 768px) {
  .climate-detail {
    gap: 2rem;
  }

  .narrative-section {
    padding: 1.5rem;
  }

  .narrative-title {
    font-size: 1.25rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .control-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .climate-table {
    font-size: 0.8rem;
  }

  .climate-table th,
  .climate-table td {
    padding: 0.75rem;
  }

  .cell-title {
    max-width: 150px;
  }

  .cell-frameworks {
    flex-wrap: wrap;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .climate-detail {
    gap: 1.5rem;
  }

  .narrative-section {
    padding: 1rem;
  }

  .narrative-title {
    font-size: 1.1rem;
  }

  .narrative-body {
    font-size: 0.9rem;
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card {
    padding: 1rem;
  }

  .chart-title {
    font-size: 0.9rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .control-group {
    border-radius: 8px;
  }

  .group-header {
    padding: 0.75rem 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .control-item {
    padding: 0.75rem 1rem;
  }

  .metric-code {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
  }

  .control-title {
    font-size: 0.9rem;
  }

  .climate-table {
    font-size: 0.75rem;
  }

  .climate-table th,
  .climate-table td {
    padding: 0.5rem;
  }

  .cell-title {
    max-width: 100px;
    word-break: break-word;
  }

  .framework-badge {
    font-size: 0.65rem;
    padding: 0.2rem 0.5rem;
  }

  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-icon {
    font-size: 2rem;
  }

  .empty-state p {
    font-size: 0.85rem;
  }
}

/* RTL Adjustments */
[dir='rtl'] {
  direction: rtl;
}

[dir='rtl'] .control-item {
  justify-content: flex-end;
}

[dir='rtl'] .group-header {
  flex-direction: row-reverse;
}

[dir='rtl'] .cell-code {
  direction: ltr;
}

[dir='rtl'] .frameworks-list {
  flex-direction: row-reverse;
}

[dir='rtl'] .climate-table th,
[dir='rtl'] .climate-table td {
  text-align: right;
}

/* SVG Gradient Definition (needs to be in style tag) */
svg {
  --gradient-start: #10b981;
  --gradient-end: #059669;
}
</style>
