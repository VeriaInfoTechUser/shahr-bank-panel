<template>
  <div class="overview-tab" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Report Introduction Section -->
    <div class="introduction-section">
      <div class="intro-card">
        <div class="intro-header">
          <h2 class="intro-title">{{ $t('overview.about') || 'About This Report' }}</h2>
          <span class="intro-badge">{{ reportingYear }}</span>
        </div>
        <p v-if="report.narratives.about_report" class="intro-body">
          {{ report.narratives.about_report }}
        </p>
        <p v-else class="intro-body-empty">
          {{ $t('overview.noAbout') || 'No introduction text available.' }}
        </p>
      </div>
    </div>

    <!-- Quick Summary Stats -->
    <div class="summary-stats-section">
      <h3 class="section-title">{{ $t('overview.quickStats') || 'Quick Summary' }}</h3>
      <div class="stats-grid">
        <div class="stat-card stat-kpis">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">{{ $t('overview.totalKpis') || 'Total KPIs' }}</div>
            <div class="stat-value">{{ report.key_figures.length }}</div>
          </div>
        </div>

        <div class="stat-card stat-year">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-label">{{ $t('overview.reportingYear') || 'Reporting Year' }}</div>
            <div class="stat-value">{{ report.meta.reporting_year }}</div>
          </div>
        </div>

        <div class="stat-card stat-date">
          <div class="stat-icon">⏰</div>
          <div class="stat-content">
            <div class="stat-label">{{ $t('overview.generatedDate') || 'Generated' }}</div>
            <div class="stat-value stat-date-value">{{ formatDate(report.meta.generated_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Metrics Grid (Top 12) -->
    <div class="key-metrics-section">
      <h3 class="section-title">{{ $t('overview.keyMetrics') || 'Key Metrics' }}</h3>
      <div class="metrics-grid">
        <div
          v-for="(metric, index) in topMetrics"
          :key="`metric-${index}`"
          :class="['metric-card', `color-${getMetricColor(metric.value)}`]"
        >
          <div class="metric-status-indicator"></div>
          <div class="metric-header">
            <div class="metric-title">{{ metric.label }}</div>
            <div v-if="metric.change" :class="['metric-badge', { 'badge-positive': metric.change > 0 }]">
              {{ metric.change > 0 ? '+' : '' }}{{ metric.change }}%
            </div>
          </div>
          <div class="metric-main">
            <div class="metric-value">{{ formatNumber(metric.value) }}</div>
            <div class="metric-unit">{{ metric.unit }}</div>
          </div>
          <div v-if="metric.trend" :class="['metric-trend', `trend-${metric.trend}`]">
            <span class="trend-icon">{{ getTrendIcon(metric.trend) }}</span>
            <span class="trend-text">{{ $t(`overview.trend.${metric.trend}`) || metric.trend }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Cards to Sections -->
    <div class="navigation-section">
      <h3 class="section-title">{{ $t('overview.exploreSections') || 'Explore Sections' }}</h3>
      <div class="nav-cards-grid">
        <button
          v-for="navCard in navigationCards"
          :key="navCard.id"
          :class="['nav-card', `nav-${navCard.id}`]"
          @click="$emit('navigate', navCard.id)"
        >
          <div class="nav-icon">{{ navCard.icon }}</div>
          <div class="nav-content">
            <h4 class="nav-title">{{ navCard.title }}</h4>
            <p class="nav-description">{{ navCard.description }}</p>
          </div>
          <div class="nav-arrow">→</div>
        </button>
      </div>
    </div>

    <!-- Report Conclusion (if available) -->
    <div v-if="report.narratives.report_conclusion" class="conclusion-section">
      <div class="conclusion-card">
        <h3 class="conclusion-title">{{ $t('overview.conclusion') || 'Conclusion' }}</h3>
        <p class="conclusion-body">{{ report.narratives.report_conclusion }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ReportData, KeyFigure } from '@/core/services/reportService';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  report: ReportData;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  navigate: [tabId: 'environmental' | 'social' | 'governance' | 'keyFigures'];
}>();

// ============================================================================
// Composition
// ============================================================================

const { locale } = useI18n();

// ============================================================================
// Computed
// ============================================================================

const isRTL = computed(() => locale.value === 'fa');

const reportingYear = computed(() => props.report.meta.reporting_year);

const topMetrics = computed<KeyFigure[]>(() => {
  return props.report.key_figures.slice(0, 12);
});

const navigationCards = computed(() => [
  {
    id: 'environmental',
    icon: '🌱',
    title: locale.value === 'fa' ? 'محیطی' : 'Environmental',
    description: locale.value === 'fa' 
      ? 'اقدامات محیط زیست و کاهش انتشار'
      : 'Environmental initiatives & emissions reduction',
  },
  {
    id: 'social',
    icon: '👥',
    title: locale.value === 'fa' ? 'اجتماعی' : 'Social',
    description: locale.value === 'fa' 
      ? 'برنامه های رفاهی و تنوع پذیری'
      : 'Social programs & diversity initiatives',
  },
  {
    id: 'governance',
    icon: '⚖️',
    title: locale.value === 'fa' ? 'حاکمیتی' : 'Governance',
    description: locale.value === 'fa' 
      ? 'اخلاقیات، امتثال و هیئت مدیره'
      : 'Ethics, compliance & board practices',
  },
  {
    id: 'keyFigures',
    icon: '📈',
    title: locale.value === 'fa' ? 'شاخص‌های کلیدی' : 'Key Figures',
    description: locale.value === 'fa' 
      ? 'تمام شاخص‌های عملکردی'
      : 'All performance indicators',
  },
]);

// ============================================================================
// Methods
// ============================================================================

/**
 * Get color code based on metric value (0-100 scale)
 * Green: 70-100, Orange: 40-69, Red: 0-39
 */
function getMetricColor(value: number | string): 'high' | 'medium' | 'low' {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (numValue >= 70) return 'high';
  if (numValue >= 40) return 'medium';
  return 'low';
}

/**
 * Format date with locale
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format number with locale
 */
function formatNumber(value: number | string): string {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Get trend icon
 */
function getTrendIcon(trend: string): string {
  const icons: Record<string, string> = {
    up: '↑',
    down: '↓',
    stable: '→',
  };
  return icons[trend] || '→';
}
</script>

<style scoped lang="css">
/* ============================================================================
   Container & Layout
   ============================================================================ */

.overview-tab {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}

/* ============================================================================
   Introduction Section
   ============================================================================ */

.introduction-section {
  width: 100%;
}

.intro-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.intro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.intro-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  flex: 1;
}

.intro-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
}

.intro-body,
.intro-body-empty {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
}

.intro-body-empty {
  opacity: 0.7;
  font-style: italic;
}

/* ============================================================================
   Summary Stats Section
   ============================================================================ */

.summary-stats-section {
  width: 100%;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-date-value {
  font-size: 1rem;
}

/* ============================================================================
   Key Metrics Section
   ============================================================================ */

.key-metrics-section {
  width: 100%;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: currentColor;
}

.metric-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.metric-card.color-high {
  border-color: #d1fae5;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  color: #22c55e;
}

.metric-card.color-high:hover {
  border-color: #6ee7b7;
  box-shadow: 0 8px 16px rgba(34, 197, 94, 0.15);
}

.metric-card.color-medium {
  border-color: #fed7aa;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
  color: #f59e0b;
}

.metric-card.color-medium:hover {
  border-color: #fbbf24;
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.15);
}

.metric-card.color-low {
  border-color: #fecaca;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  color: #ef4444;
}

.metric-card.color-low:hover {
  border-color: #fca5a5;
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.15);
}

.metric-status-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.3;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 0.5rem;
}

.metric-title {
  font-size: 0.9rem;
  font-weight: 600;
  flex: 1;
  line-height: 1.3;
}

.metric-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.1);
  white-space: nowrap;
  font-weight: 600;
}

.metric-badge.badge-positive {
  background: rgba(34, 197, 94, 0.2);
  color: #16a34a;
}

.metric-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
}

.metric-unit {
  font-size: 0.85rem;
  opacity: 0.7;
  font-weight: 500;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.trend-icon {
  font-size: 1rem;
}

.trend-text {
  opacity: 0.8;
}

/* ============================================================================
   Navigation Section
   ============================================================================ */

.navigation-section {
  width: 100%;
}

.nav-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  font-family: inherit;
}

.nav-card:hover {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  transform: translateX(-4px);
}

.nav-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.nav-content {
  flex: 1;
  min-width: 0;
}

.nav-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.nav-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
}

.nav-arrow {
  font-size: 1.5rem;
  color: #3b82f6;
  flex-shrink: 0;
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.3s;
}

.nav-card:hover .nav-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* ============================================================================
   Conclusion Section
   ============================================================================ */

.conclusion-section {
  width: 100%;
}

.conclusion-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
  border-left: 4px solid #22c55e;
  border-radius: 10px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
}

.conclusion-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.conclusion-body {
  font-size: 1rem;
  line-height: 1.6;
  color: #4b5563;
  margin: 0;
}

/* ============================================================================
   Responsive Design
   ============================================================================ */

/* Tablet */
@media (max-width: 768px) {
  .overview-tab {
    gap: 1.5rem;
  }

  .intro-card {
    padding: 1.5rem;
  }

  .intro-title {
    font-size: 1.25rem;
  }

  .intro-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .nav-cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .nav-card {
    gap: 1rem;
    padding: 1rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .overview-tab {
    gap: 1rem;
  }

  .intro-card {
    padding: 1rem;
  }

  .intro-title {
    font-size: 1.1rem;
  }

  .intro-body {
    font-size: 0.9rem;
  }

  .section-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    font-size: 1.5rem;
  }

  .stat-label {
    font-size: 0.75rem;
  }

  .stat-value {
    font-size: 1.3rem;
  }

  .stat-date-value {
    font-size: 0.85rem;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-title {
    font-size: 0.85rem;
  }

  .metric-value {
    font-size: 1.3rem;
  }

  .nav-cards-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .nav-card {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .nav-icon {
    font-size: 1.5rem;
  }

  .nav-title {
    font-size: 0.9rem;
  }

  .nav-description {
    font-size: 0.75rem;
  }

  .nav-arrow {
    font-size: 1.25rem;
  }

  .conclusion-card {
    padding: 1rem;
  }

  .conclusion-title {
    font-size: 1.1rem;
  }

  .conclusion-body {
    font-size: 0.9rem;
  }
}

/* RTL Adjustments */
[dir='rtl'] {
  direction: rtl;
}

[dir='rtl'] .intro-header {
  flex-direction: row-reverse;
}

[dir='rtl'] .metric-header {
  flex-direction: row-reverse;
}

[dir='rtl'] .nav-card {
  flex-direction: row-reverse;
  text-align: right;
}

[dir='rtl'] .metric-main {
  flex-direction: row-reverse;
}

[dir='rtl'] .metric-trend {
  flex-direction: row-reverse;
}

[dir='rtl'] .stat-card {
  flex-direction: row-reverse;
}

[dir='rtl'] .nav-arrow {
  transform: translateX(4px);
}

[dir='rtl'] .nav-card:hover .nav-arrow {
  transform: translateX(0);
}
</style>
