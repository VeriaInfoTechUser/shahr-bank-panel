<template>
  <div class="governance-section">
    <!-- Header with Narrative -->
    <div v-if="narrative" class="narrative-section">
      <h2 class="narrative-title">{{ narrative.title }}</h2>
      <p class="narrative-body">{{ narrative.body }}</p>
    </div>

    <!-- Sub-section Tabs Navigation -->
    <div class="tabs-container">
      <div class="tabs-nav">
        <button
          v-for="tab in governanceTabs"
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
        <!-- Board of Directors Tab -->
        <div v-if="activeTab === 'board'" class="tab-pane board-pane">
          <BoardDetail
            :narrative="reportData?.narratives?.governance?.board"
            :metadata="reportData?.governance?.board"
            :controls="reportData?.governance?.board?.controls"
          />
        </div>

        <!-- Ethics & Compliance Tab -->
        <div v-if="activeTab === 'ethics'" class="tab-pane ethics-pane">
          <EthicsComplianceDetail
            :narrative="reportData?.narratives?.governance?.ethics"
            :metadata="reportData?.governance?.ethics"
            :controls="reportData?.governance?.ethics?.controls"
          />
        </div>

        <!-- Regulatory Compliance Tab -->
        <div v-if="activeTab === 'regulatory'" class="tab-pane regulatory-pane">
          <RegulatoryComplianceDetail
            :narrative="reportData?.narratives?.governance?.regulatory"
            :metadata="reportData?.governance?.regulatory"
            :controls="reportData?.governance?.regulatory?.controls"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BoardDetail from './governance/BoardDetail.vue'
import EthicsComplianceDetail from './governance/EthicsComplianceDetail.vue'
import RegulatoryComplianceDetail from './governance/RegulatoryComplianceDetail.vue'

interface ReportData {
  narratives?: {
    governance?: {
      intro?: {
        title: string
        body: string
      }
      board?: {
        title: string
        body: string
      }
      ethics?: {
        title: string
        body: string
      }
      regulatory?: {
        title: string
        body: string
      }
    }
  }
  governance?: {
    board?: {
      controls?: any[]
      [key: string]: any
    }
    ethics?: {
      controls?: any[]
      [key: string]: any
    }
    regulatory?: {
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
const activeTab = ref<'board' | 'ethics' | 'regulatory'>('board')

// Governance section tabs definition
const governanceTabs = computed(() => [
  {
    id: 'board',
    label: t('esg.governance.board'),
    icon: '👔',
  },
  {
    id: 'ethics',
    label: t('esg.governance.ethics'),
    icon: '⚖️',
  },
  {
    id: 'regulatory',
    label: t('esg.governance.regulatory'),
    icon: '📋',
  },
])
</script>

<style scoped lang="scss">
.governance-section {
  width: 100%;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(37, 99, 235, 0.02) 100%);
  border-radius: 0.75rem;
}

// Narrative Section
.narrative-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 0.5rem;
  border-left: 4px solid #2563eb;

  [dir='rtl'] & {
    border-left: none;
    border-right: 4px solid #2563eb;
  }

  .narrative-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0 0 0.75rem 0;
  }

  .narrative-body {
    margin: 0;
    color: #1e3a8a;
    line-height: 1.6;
    font-size: 0.95rem;
  }
}

// Tabs Container
.tabs-container {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #bfdbfe;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}

// Tabs Navigation
.tabs-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  padding: 0;
  background: linear-gradient(90deg, #eff6ff 0%, #dbeafe 100%);
  border-bottom: 2px solid #bfdbfe;
  overflow-x: auto;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: #e0e7ff;
  }

  &::-webkit-scrollbar-thumb {
    background: #93c5fd;
    border-radius: 2px;

    &:hover {
      background: #60a5fa;
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
  color: #1e40af;
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
    background: rgba(37, 99, 235, 0.05);
    color: #2563eb;
  }

  &.active {
    background: white;
    color: #2563eb;
    border-bottom-color: #2563eb;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
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
  .governance-section {
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
  .governance-section {
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
