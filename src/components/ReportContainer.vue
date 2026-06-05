<template>
  <div class="report-container" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header Section -->
    <div v-if="!isLoading && report" class="report-header">
      <div class="header-content">
        <h1 class="report-title">
          {{ $t('report.title') || '' }} {{ report.meta.reporting_year }}
        </h1>
        <p class="report-subtitle">
          {{ $t('report.generated') || 'Generated' }}: {{ formatDate(report.meta.generated_at) }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('report.loading') || 'Loading report...' }}</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3>{{ $t('report.error') || 'Error' }}</h3>
      <p>{{ error }}</p>
      <button @click="retryFetch" class="btn-retry">
        {{ $t('report.retry') || 'Retry' }}
      </button>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="report-content">
      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>
      </div>

      <!-- Tab Contents -->
      <div class="tabs-content">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="tab-pane">
          <div class="overview-section">
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">{{ $t('report.reportingYear') || 'Reporting Year' }}</div>
                <div class="info-value">{{ report.meta.reporting_year }}</div>
              </div>
              <div class="info-card">
                <div class="info-label">{{ $t('report.generatedDate') || 'Generated Date' }}</div>
                <div class="info-value">{{ formatDate(report.meta.generated_at) }}</div>
              </div>
              <div class="info-card">
                <div class="info-label">{{ $t('report.sections') || 'Sections' }}</div>
                <div class="info-value">3</div>
              </div>
              <div class="info-card">
                <div class="info-label">{{ $t('report.kpis') || 'Key Figures' }}</div>
                <div class="info-value">{{ report.key_figures.length }}</div>
              </div>
            </div>

            <!-- Narrative Section -->
            <div v-if="report.narratives.about_report" class="narrative-card">
              <h3>{{ $t('report.about') || 'About This Report' }}</h3>
              <p>{{ report.narratives.about_report }}</p>
            </div>

            <div v-if="report.narratives.report_conclusion" class="narrative-card">
              <h3>{{ $t('report.conclusion') || 'Conclusion' }}</h3>
              <p>{{ report.narratives.report_conclusion }}</p>
            </div>
          </div>
        </div>

        <!-- Environmental Tab -->
        <div v-if="activeTab === 'environmental'" class="tab-pane">
          <div class="section-content">
            <div class="metrics-grid">
              <div v-for="(value, key) in report.environmental" :key="`env-${key}`" class="metric-card">
                <div class="metric-label">{{ formatMetricName(key) }}</div>
                <div class="metric-value">{{ value }}</div>
              </div>
            </div>
            <div v-if="report.narratives.environmental" class="narrative-card">
              <h3>{{ $t('report.environmentalDetail') || 'Environmental Details' }}</h3>
              <p>{{ report.narratives.environmental }}</p>
            </div>
          </div>
        </div>

        <!-- Social Tab -->
        <div v-if="activeTab === 'social'" class="tab-pane">
          <div class="section-content">
            <div class="metrics-grid">
              <div v-for="(value, key) in report.social" :key="`social-${key}`" class="metric-card">
                <div class="metric-label">{{ formatMetricName(key) }}</div>
                <div class="metric-value">{{ value }}</div>
              </div>
            </div>
            <div v-if="report.narratives.social" class="narrative-card">
              <h3>{{ $t('report.socialDetail') || 'Social Details' }}</h3>
              <p>{{ report.narratives.social }}</p>
            </div>
          </div>
        </div>

        <!-- Governance Tab -->
        <div v-if="activeTab === 'governance'" class="tab-pane">
          <div class="section-content">
            <div class="metrics-grid">
              <div v-for="(value, key) in report.governance" :key="`gov-${key}`" class="metric-card">
                <div class="metric-label">{{ formatMetricName(key) }}</div>
                <div class="metric-value">{{ value }}</div>
              </div>
            </div>
            <div v-if="report.narratives.governance" class="narrative-card">
              <h3>{{ $t('report.governanceDetail') || 'Governance Details' }}</h3>
              <p>{{ report.narratives.governance }}</p>
            </div>
          </div>
        </div>

        <!-- Key Figures Tab -->
        <div v-if="activeTab === 'keyFigures'" class="tab-pane">
          <div class="key-figures-section">
            <div class="kpi-cards-grid">
              <div v-for="kpi in report.key_figures" :key="kpi.code" class="kpi-card">
                <div class="kpi-header">
                  <div class="kpi-label">{{ kpi.label }}</div>
                  <span v-if="kpi.trend" :class="['trend-badge', `trend-${kpi.trend}`]">
                    {{ kpi.trend === 'up' ? '↑' : kpi.trend === 'down' ? '↓' : '→' }}
                  </span>
                </div>
                <div class="kpi-main">
                  <div class="kpi-value">{{ formatNumber(kpi.value) }}</div>
                  <div class="kpi-unit">{{ kpi.unit }}</div>
                </div>
                <div v-if="kpi.change" class="kpi-change" :class="{ negative: kpi.change < 0 }">
                  {{ kpi.change > 0 ? '+' : '' }}{{ kpi.change }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Refresh Button -->
      <div class="report-footer">
        <button @click="refreshReport" class="btn-refresh">
          <span class="btn-icon">🔄</span>
          {{ $t('report.refresh') || 'Refresh' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { reportService, type ReportData, ReportServiceError } from '@/core/services/reportService';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface Tab {
  id: 'overview' | 'environmental' | 'social' | 'governance' | 'keyFigures';
  label: string;
  icon: string;
}

// ============================================================================
// Composition Setup
// ============================================================================

const { locale } = useI18n();

// State
const report = ref<ReportData | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const activeTab = ref<'overview' | 'environmental' | 'social' | 'governance' | 'keyFigures'>('overview');

// Computed
const isRTL = computed(() => locale.value === 'fa');

const tabs = computed<Tab[]>(() => [
  {
    id: 'overview',
    label: locale.value === 'fa' ? 'نمای کلی' : 'Overview',
    icon: '📊',
  },
  {
    id: 'environmental',
    label: locale.value === 'fa' ? 'محیطی' : 'Environmental',
    icon: '🌱',
  },
  {
    id: 'social',
    label: locale.value === 'fa' ? 'اجتماعی' : 'Social',
    icon: '👥',
  },
  {
    id: 'governance',
    label: locale.value === 'fa' ? 'حاکمیتی' : 'Governance',
    icon: '⚖️',
  },
  {
    id: 'keyFigures',
    label: locale.value === 'fa' ? 'شاخص‌های کلیدی' : 'Key Figures',
    icon: '📈',
  },
]);

// ============================================================================
// Methods
// ============================================================================

/**
 * Fetch report from service
 */
async function fetchReport(forceRefresh = false) {
  isLoading.value = true;
  error.value = null;

  try {
    report.value = await reportService.fetchReport(forceRefresh);
  } catch (err) {
    if (err instanceof ReportServiceError) {
      error.value = err.message;
      console.error(`[${err.code}]`, err.originalError);
    } else {
      error.value = locale.value === 'fa'
        ? 'خطایی نامعلوم رخ داده است'
        : 'An unknown error occurred';
    }
  } finally {
    isLoading.value = false;
  }
}

/**
 * Retry fetching on error
 */
function retryFetch() {
  fetchReport();
}

/**
 * Refresh with fresh data
 */
function refreshReport() {
  fetchReport(true);
}

/**
 * Format date string
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Format metric names (snake_case to readable)
 */
function formatMetricName(name: string): string {
  const names: Record<string, string> = {
    climate: locale.value === 'fa' ? 'آب و هوا' : 'Climate',
    ghg: locale.value === 'fa' ? 'گازهای گلخانه‌ای' : 'GHG Emissions',
    energy: locale.value === 'fa' ? 'انرژی' : 'Energy',
    water: locale.value === 'fa' ? 'آب' : 'Water',
    waste: locale.value === 'fa' ? 'زباله' : 'Waste',
    workforce: locale.value === 'fa' ? 'نیروی کار' : 'Workforce',
    dei: locale.value === 'fa' ? 'تنوع و شمول' : 'Diversity & Inclusion',
    health_safety: locale.value === 'fa' ? 'سلامت و ایمنی' : 'Health & Safety',
    board: locale.value === 'fa' ? 'هیئت مدیره' : 'Board',
    ethics: locale.value === 'fa' ? 'اخلاقیات' : 'Ethics',
    compliance: locale.value === 'fa' ? 'انطباق' : 'Compliance',
  };
  return names[name] || name;
}

/**
 * Format numbers with locale
 */
function formatNumber(value: number | string): string {
  if (typeof value === 'string') return value;
  return new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US').format(value);
}

// ============================================================================
// Lifecycle
// ============================================================================

onMounted(() => {
  fetchReport();
});
</script>

<style scoped lang="css">
/* ============================================================================
   Container & Layout
   ============================================================================ */

.report-container {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

/* ============================================================================
   Header Section
   ============================================================================ */

.report-header {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
}

.report-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
}

.report-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

/* ============================================================================
   Loading State
   ============================================================================ */

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 12px;
  padding: 3rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* ============================================================================
   Error State
   ============================================================================ */

.error-state {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  border-left: 4px solid #ef4444;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.error-state p {
  color: #6b7280;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.btn-retry {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* ============================================================================
   Report Content
   ============================================================================ */

.report-content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* ============================================================================
   Tabs Navigation
   ============================================================================ */

.tabs-container {
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tabs-nav {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;
  overflow-x: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.tab-btn:hover {
  color: #1f2937;
  background: #f3f4f6;
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.tab-icon {
  font-size: 1.2rem;
}

.tab-label {
  font-size: 0.95rem;
}

/* ============================================================================
   Tab Content Area
   ============================================================================ */

.tabs-content {
  padding: 2rem;
  min-height: 400px;
}

.tab-pane {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ============================================================================
   Overview Section
   ============================================================================ */

.overview-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  transition: transform 0.2s;
}

.info-card:hover {
  transform: translateY(-4px);
}

.info-label {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-bottom: 0.5rem;
}

.info-value {
  font-size: 2rem;
  font-weight: 700;
}

/* ============================================================================
   Section Content
   ============================================================================ */

.section-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.2s;
}

.metric-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.metric-label {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

/* ============================================================================
   Key Figures Section
   ============================================================================ */

.key-figures-section {
  display: flex;
  flex-direction: column;
}

.kpi-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.kpi-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.kpi-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-4px);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.kpi-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
  flex: 1;
}

.trend-badge {
  display: inline-block;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
}

.trend-up {
  background: #dcfce7;
  color: #22c55e;
}

.trend-down {
  background: #fee2e2;
  color: #ef4444;
}

.trend-stable {
  background: #fef3c7;
  color: #f59e0b;
}

.kpi-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.kpi-unit {
  font-size: 0.85rem;
  color: #9ca3af;
}

.kpi-change {
  font-size: 0.85rem;
  color: #22c55e;
  font-weight: 600;
}

.kpi-change.negative {
  color: #ef4444;
}

/* ============================================================================
   Narrative Cards
   ============================================================================ */

.narrative-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
  border: 1px solid #d1fae5;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.narrative-card h3 {
  color: #1f2937;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.narrative-card p {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

/* ============================================================================
   Footer Section
   ============================================================================ */

.report-footer {
  border-top: 1px solid #e5e7eb;
  padding: 1.5rem 2rem;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-icon {
  font-size: 1rem;
  display: inline-block;
}

.btn-refresh:active {
  transform: translateY(0);
}

/* ============================================================================
   Responsive Design
   ============================================================================ */

/* Tablet */
@media (max-width: 768px) {
  .report-container {
    padding: 0.75rem;
  }

  .report-header {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .report-title {
    font-size: 1.5rem;
  }

  .report-subtitle {
    font-size: 0.85rem;
  }

  .tabs-nav {
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .tab-btn {
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    flex: 1;
    min-width: 80px;
  }

  .tab-label {
    display: none;
  }

  .tabs-content {
    padding: 1.5rem;
  }

  .info-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .kpi-cards-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .report-footer {
    padding: 1rem 1.5rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .report-container {
    padding: 0.5rem;
  }

  .report-header {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .report-title {
    font-size: 1.25rem;
  }

  .report-subtitle {
    font-size: 0.75rem;
  }

  .tabs-nav {
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .tab-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }

  .tab-icon {
    font-size: 1rem;
  }

  .tabs-content {
    padding: 1rem;
  }

  .loading-state,
  .error-state {
    padding: 2rem 1rem;
    min-height: 300px;
  }

  .spinner {
    width: 40px;
    height: 40px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .info-card {
    padding: 1rem;
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .report-footer {
    flex-direction: column;
    padding: 1rem;
  }

  .btn-refresh {
    width: 100%;
    justify-content: center;
  }
}

/* RTL Adjustments */
[dir='rtl'] {
  direction: rtl;
}

[dir='rtl'] .kpi-header {
  flex-direction: row-reverse;
}

[dir='rtl'] .report-footer {
  justify-content: flex-start;
}

[dir='rtl'] .tabs-nav {
  flex-direction: row-reverse;
}
</style>
