<template>
  <div class="social-section">
    <!-- Header with Narrative -->
    <div v-if="narrative" class="narrative-section">
      <h2 class="narrative-title">{{ narrative.title }}</h2>
      <p class="narrative-body">{{ narrative.body }}</p>
    </div>

    <!-- Sub-section Tabs Navigation -->
    <div class="tabs-container">
      <div class="tabs-nav">
        <button
          v-for="tab in socialTabs"
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Workforce Tab -->
        <div v-if="activeTab === 'workforce'" class="tab-pane workforce-pane">
          <WorkforceDetail
            :narrative="reportData?.narratives?.social?.workforce"
            :metadata="reportData?.social?.workforce"
            :controls="reportData?.social?.workforce?.controls"
          />
        </div>

        <!-- Diversity, Equity & Inclusion Tab -->
        <div v-if="activeTab === 'dei'" class="tab-pane dei-pane">
          <DEIDetail
            :narrative="reportData?.narratives?.social?.dei"
            :metadata="reportData?.social?.dei"
            :controls="reportData?.social?.dei?.controls"
          />
        </div>

        <!-- Health & Safety Tab -->
        <div v-if="activeTab === 'health_safety'" class="tab-pane health-safety-pane">
          <HealthSafetyDetail
            :narrative="reportData?.narratives?.social?.health_safety"
            :metadata="reportData?.social?.health_safety"
            :controls="reportData?.social?.health_safety?.controls"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WorkforceDetail from './social/WorkforceDetail.vue'
import DEIDetail from './social/DEIDetail.vue'
import HealthSafetyDetail from './social/HealthSafetyDetail.vue'

interface ReportData {
  narratives?: {
    social?: {
      intro?: {
        title: string
        body: string
      }
      workforce?: {
        title: string
        body: string
      }
      dei?: {
        title: string
        body: string
      }
      health_safety?: {
        title: string
        body: string
      }
    }
  }
  social?: {
    workforce?: {
      controls?: any[]
      [key: string]: any
    }
    dei?: {
      controls?: any[]
      [key: string]: any
    }
    health_safety?: {
      controls?: any[]
      [key: string]: any
    }
  }
}

interface Props {
  narrative?: {
    title: string
    body: string
  }
  reportData?: ReportData
}

defineProps<Props>()

const { t } = useI18n()

// Active tab state
const activeTab = ref<'workforce' | 'dei' | 'health_safety'>('workforce')

// Social section tabs definition
const socialTabs = computed(() => [
  {
    id: 'workforce',
    label: t('esg.social.workforce'),
    icon: '👥',
  },
  {
    id: 'dei',
    label: t('esg.social.dei'),
    icon: '🤝',
  },
  {
    id: 'health_safety',
    label: t('esg.social.health_safety'),
    icon: '🛡️',
  },
])
</script>

<style scoped lang="scss">
.social-section {
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.02) 0%, rgba(59, 130, 246, 0.02) 100%);
  border-radius: 0.75rem;
}

// Narrative Section
.narrative-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%);
  border-radius: 0.5rem;
  border-left: 4px solid #7c3aed;

  [dir='rtl'] & {
    border-left: none;
    border-right: 4px solid #7c3aed;
  }

  .narrative-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #4c1d95;
    margin: 0 0 0.75rem 0;
  }

  .narrative-body {
    margin: 0;
    color: #4c1d95;
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

// Tabs Container
.tabs-container {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e9d5ff;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.08);
}

// Tabs Navigation
.tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 0;
  background: linear-gradient(90deg, #faf5ff 0%, #eff6ff 100%);
  border-bottom: 2px solid #e9d5ff;
  overflow-x: auto;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #f3e8ff;
  }

  &::-webkit-scrollbar-thumb {
    background: #c4b5fd;
    border-radius: 2px;

    &:hover {
      background: #a78bfa;
    }
  }
}

.tab-button {
  flex: 1;
  min-width: 140px;
  padding: 1rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b21a8;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
  border-bottom: 3px solid transparent;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  .tab-icon {
    font-size: 1.25rem;
  }

  .tab-label {
    white-space: nowrap;
  }

  &:hover:not(.active) {
    background: rgba(168, 85, 247, 0.05);
    color: #7c3aed;
  }

  &.active {
    background: white;
    color: #7c3aed;
    border-bottom-color: #7c3aed;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(168, 85, 247, 0.1);
  }

  @media (max-width: 768px) {
    min-width: 120px;
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;

    .tab-label {
      display: none;
    }

    &.active .tab-label {
      display: inline;
    }
  }
}

// Tab Content
.tab-content {
  padding: 2rem 1.5rem;
  min-height: 400px;
  animation: fadeIn 0.3s ease;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
    min-height: 300px;
  }
}

.tab-pane {
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// Responsive
@media (max-width: 1024px) {
  .social-section {
    padding: 1rem;
  }

  .narrative-section {
    padding: 1rem;
    margin-bottom: 1.5rem;

    .narrative-title {
      font-size: 1.25rem;
    }

    .narrative-body {
      font-size: 0.9rem;
    }
  }

  .tab-content {
    padding: 1.5rem 1rem;
    min-height: 350px;
  }
}

@media (max-width: 768px) {
  .social-section {
    padding: 0.75rem;
  }

  .narrative-section {
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 0.375rem;

    .narrative-title {
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
    }

    .narrative-body {
      font-size: 0.85rem;
      line-height: 1.5;
    }
  }

  .tabs-container {
    border-radius: 0.5rem;
  }

  .tabs-nav {
    gap: 0;
    padding: 0;
  }

  .tab-button {
    padding: 0.75rem;
    min-width: 100px;
    font-size: 0.8rem;
  }

  .tab-content {
    padding: 1rem;
    min-height: 250px;
  }
}
</style>
