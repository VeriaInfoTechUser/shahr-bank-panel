<template>
  <div class="environmental-section" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header with Introduction -->
    <div class="section-header">
      <div class="header-content">
        <h2 class="section-title">
          {{ $t('environmental.title') || 'عملکرد زیست‌محیطی' }}
        </h2>
        <p v-if="report.narratives.environmental" class="section-intro">
          {{ report.narratives.environmental }}
        </p>
        <p v-else class="section-intro-empty">
          {{ $t('environmental.noIntro') || 'No introduction available.' }}
        </p>
      </div>
      <div class="header-icon">🌍</div>
    </div>

    <!-- Sub-section Tabs -->
    <div class="sub-tabs-container">
      <div class="sub-tabs-nav">
        <button
          v-for="tab in subTabs"
          :key="tab.id"
          :class="['sub-tab-btn', { active: activeSubTab === tab.id }]"
          @click="activeSubTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Sub-tab Content -->
    <div class="sub-tabs-content">
      <!-- Climate Tab -->
      <div v-if="activeSubTab === 'climate'" class="sub-tab-pane">
        <ClimateMeter :value="report.environmental.climate" />
        <div class="detail-card">
          <h3 class="detail-title">{{ $t('environmental.climate.title') || 'Climate Performance' }}</h3>
          <p class="detail-text">
            {{ $t('environmental.climate.description') || 'Climate-related metrics and targets' }}
          </p>
          <div class="metrics-display">
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.climate.score') || 'Score' }}</span>
              <span class="metric-value">{{ report.environmental.climate }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- GHG Emissions Tab -->
      <div v-if="activeSubTab === 'ghg'" class="sub-tab-pane">
        <GHGMeter :value="report.environmental.ghg" />
        <div class="detail-card">
          <h3 class="detail-title">{{ $t('environmental.ghg.title') || 'GHG Emissions' }}</h3>
          <p class="detail-text">
            {{ $t('environmental.ghg.description') || 'Greenhouse gas emissions tracking and reduction' }}
          </p>
          <div class="metrics-display">
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.ghg.emissions') || 'Emissions' }}</span>
              <span class="metric-value">{{ report.environmental.ghg }} tCO₂e</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.ghg.reduction') || 'Reduction Target' }}</span>
              <span class="metric-value">50% by 2030</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Energy Tab -->
      <div v-if="activeSubTab === 'energy'" class="sub-tab-pane">
        <EnergyMeter :value="report.environmental.energy" />
        <div class="detail-card">
          <h3 class="detail-title">{{ $t('environmental.energy.title') || 'Energy Management' }}</h3>
          <p class="detail-text">
            {{ $t('environmental.energy.description') || 'Renewable energy usage and efficiency' }}
          </p>
          <div class="metrics-display">
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.energy.renewable') || 'Renewable %' }}</span>
              <span class="metric-value">{{ report.environmental.energy }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.energy.efficiency') || 'Efficiency Gain' }}</span>
              <span class="metric-value">+15% YoY</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Water Tab -->
      <div v-if="activeSubTab === 'water'" class="sub-tab-pane">
        <WaterMeter :value="report.environmental.water" />
        <div class="detail-card">
          <h3 class="detail-title">{{ $t('environmental.water.title') || 'Water Conservation' }}</h3>
          <p class="detail-text">
            {{ $t('environmental.water.description') || 'Water usage and conservation initiatives' }}
          </p>
          <div class="metrics-display">
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.water.conservation') || 'Conservation Rate' }}</span>
              <span class="metric-value">{{ report.environmental.water }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.water.recycling') || 'Recycling Rate' }}</span>
              <span class="metric-value">{{ report.environmental.water * 0.8 | toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Waste Tab -->
      <div v-if="activeSubTab === 'waste'" class="sub-tab-pane">
        <WasteMeter :value="report.environmental.waste" />
        <div class="detail-card">
          <h3 class="detail-title">{{ $t('environmental.waste.title') || 'Waste Management' }}</h3>
          <p class="detail-text">
            {{ $t('environmental.waste.description') || 'Waste reduction and recycling programs' }}
          </p>
          <div class="metrics-display">
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.waste.diversion') || 'Diversion Rate' }}</span>
              <span class="metric-value">{{ report.environmental.waste }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">{{ $t('environmental.waste.hazardous') || 'Hazardous Waste' }}</span>
              <span class="metric-value">{{ report.environmental.waste * 0.1 | toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Additional Info Section -->
    <div class="info-section">
      <div class="info-card">
        <h3>{{ $t('environmental.initiatives') || 'Key Initiatives' }}</h3>
        <ul class="initiatives-list">
          <li>✅ {{ $t('environmental.init1') || 'Renewable energy transition' }}</li>
          <li>✅ {{ $t('environmental.init2') || 'Carbon neutrality target' }}</li>
          <li>✅ {{ $t('environmental.init3') || 'Water conservation program' }}</li>
          <li>✅ {{ $t('environmental.init4') || 'Waste reduction strategy' }}</li>
        </ul>
      </div>

      <div class="info-card">
        <h3>{{ $t('environmental.goals') || 'Goals & Targets' }}</h3>
        <ul class="goals-list">
          <li>🎯 {{ $t('environmental.goal1') || 'Net Zero by 2050' }}</li>
          <li>🎯 {{ $t('environmental.goal2') || '100% Renewable Energy by 2035' }}</li>
          <li>🎯 {{ $t('environmental.goal3') || 'Zero Waste to Landfill by 2030' }}</li>
          <li>🎯 {{ $t('environmental.goal4') || 'Water Neutral by 2025' }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ReportData } from '@/core/services/reportService';
import ClimateMeter from './ClimateMeter.vue';
import GHGMeter from './GHGMeter.vue';
import EnergyMeter from './EnergyMeter.vue';
import WaterMeter from './WaterMeter.vue';
import WasteMeter from './WasteMeter.vue';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  report: ReportData;
}

defineProps<Props>();

// ============================================================================
// Composition
// ============================================================================

const { locale } = useI18n();

// ============================================================================
// State
// ============================================================================

const activeSubTab = ref<'climate' | 'ghg' | 'energy' | 'water' | 'waste'>('climate');

// ============================================================================
// Computed
// ============================================================================

const isRTL = computed(() => locale.value === 'fa');

const subTabs = computed(() => [
  {
    id: 'climate',
    icon: '🌡️',
    label: locale.value === 'fa' ? 'آب و هوا' : 'Climate',
  },
  {
    id: 'ghg',
    icon: '💨',
    label: locale.value === 'fa' ? 'گازهای گلخانه‌ای' : 'GHG Emissions',
  },
  {
    id: 'energy',
    icon: '⚡',
    label: locale.value === 'fa' ? 'انرژی' : 'Energy',
  },
  {
    id: 'water',
    icon: '💧',
    label: locale.value === 'fa' ? 'آب' : 'Water',
  },
  {
    id: 'waste',
    icon: '♻️',
    label: locale.value === 'fa' ? 'زباله' : 'Waste',
  },
]);
</script>

<style scoped lang="css">
/* ============================================================================
   Container & Layout
   ============================================================================ */

.environmental-section {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  width: 100%;
}

/* ============================================================================
   Header Section
   ============================================================================ */

.section-header {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
}

.section-intro,
.section-intro-empty {
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.95;
}

.section-intro-empty {
  opacity: 0.7;
  font-style: italic;
}

.header-icon {
  font-size: 3rem;
  flex-shrink: 0;
  line-height: 1;
}

/* ============================================================================
   Sub-tabs Navigation
   ============================================================================ */

.sub-tabs-container {
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
}

.sub-tabs-nav {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;
  overflow-x: auto;
  background: white;
}

.sub-tab-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
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
  flex: 1;
  min-width: 120px;
  justify-content: center;
}

.sub-tab-btn:hover {
  color: #1f2937;
  background: #f3f4f6;
}

.sub-tab-btn.active {
  color: #10b981;
  border-bottom-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.tab-icon {
  font-size: 1.25rem;
}

.tab-label {
  font-size: 0.95rem;
}

/* ============================================================================
   Sub-tab Content Area
   ============================================================================ */

.sub-tabs-content {
  padding: 2.5rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  min-height: 400px;
}

.sub-tab-pane {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
   Detail Cards & Meters
   ============================================================================ */

.detail-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
  border: 1px solid #d1fae5;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.detail-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.detail-text {
  font-size: 0.95rem;
  color: #4b5563;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.metrics-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.metric-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
}

/* ============================================================================
   Meter Components (Inline Styles)
   ============================================================================ */

.meter {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
  border-radius: 10px;
  border: 1px solid #d1fae5;
}

.meter-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.meter-bar {
  width: 100%;
  height: 30px;
  background: #e5e7eb;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 1rem;
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  transition: width 0.3s ease;
}

.meter-value {
  font-size: 1rem;
  color: #059669;
  font-weight: 600;
}

/* ============================================================================
   Info Section
   ============================================================================ */

.info-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.info-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 1.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.info-card:hover {
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
  transform: translateY(-2px);
}

.info-card h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.initiatives-list,
.goals-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.initiatives-list li,
.goals-list li {
  font-size: 0.95rem;
  color: #4b5563;
  padding: 0.5rem 0;
  line-height: 1.5;
}

.initiatives-list li {
  padding-left: 0;
}

.goals-list li {
  padding-left: 0;
}

/* ============================================================================
   Responsive Design
   ============================================================================ */

/* Tablet */
@media (max-width: 768px) {
  .environmental-section {
    gap: 1.75rem;
  }

  .section-header {
    padding: 1.5rem;
    gap: 1rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .section-title {
    font-size: 1.4rem;
  }

  .header-icon {
    font-size: 2rem;
  }

  .sub-tab-btn {
    padding: 1rem 0.75rem;
    font-size: 0.85rem;
    flex: 1;
    min-width: 100px;
  }

  .tab-label {
    display: none;
  }

  .sub-tabs-content {
    padding: 1.5rem;
    min-height: auto;
  }

  .detail-card {
    padding: 1.25rem;
  }

  .metrics-display {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .info-section {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

/* Mobile */
@media (max-width: 480px) {
  .environmental-section {
    gap: 1rem;
  }

  .section-header {
    padding: 1rem;
    gap: 0.75rem;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .section-intro {
    font-size: 0.9rem;
  }

  .header-icon {
    font-size: 1.5rem;
  }

  .sub-tabs-container {
    border-radius: 0;
  }

  .sub-tab-btn {
    padding: 0.75rem 0.5rem;
    font-size: 0.7rem;
    min-width: 80px;
  }

  .tab-icon {
    font-size: 1rem;
  }

  .sub-tabs-content {
    padding: 1rem;
    border-radius: 0;
  }

  .detail-card {
    padding: 1rem;
  }

  .detail-title {
    font-size: 1.1rem;
  }

  .detail-text {
    font-size: 0.85rem;
  }

  .metric-item {
    padding: 0.75rem;
  }

  .metric-label {
    font-size: 0.75rem;
  }

  .metric-value {
    font-size: 1.2rem;
  }

  .info-card {
    padding: 1rem;
  }

  .info-card h3 {
    font-size: 1rem;
  }

  .initiatives-list li,
  .goals-list li {
    font-size: 0.85rem;
  }
}

/* RTL Adjustments */
[dir='rtl'] {
  direction: rtl;
}

[dir='rtl'] .section-header {
  flex-direction: row-reverse;
}

[dir='rtl'] .metric-item {
  border-left: none;
  border-right: 3px solid #10b981;
}

[dir='rtl'] .meter-fill {
  padding-right: 0;
  padding-left: 1rem;
  justify-content: flex-start;
}
</style>
