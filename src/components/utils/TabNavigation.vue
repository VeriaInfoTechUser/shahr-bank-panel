<template>
  <div class="tab-navigation-wrapper" :class="{ vertical, 'has-dropdown': isMobile }">
    <!-- Horizontal/Vertical Tabs (Desktop) -->
    <div v-if="!isMobile" class="tabs-nav" :class="{ horizontal: !vertical, vertical }">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-button"
        :class="{ 
          active: activeTab === tab.id,
          'has-icon': tab.icon,
          'has-badge': tab.badge,
        }"
        @click="activeTab = tab.id"
      >
        <span v-if="tab.icon" class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- Dropdown (Mobile) -->
    <div v-if="isMobile" class="tabs-dropdown">
      <button class="dropdown-trigger" @click="isDropdownOpen = !isDropdownOpen">
        <span v-if="currentTabIcon" class="dropdown-icon">{{ currentTabIcon }}</span>
        <span class="dropdown-label">{{ currentTabLabel }}</span>
        <span class="dropdown-arrow" :class="{ open: isDropdownOpen }">▼</span>
      </button>
      <div v-if="isDropdownOpen" class="dropdown-menu">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="dropdown-item"
          :class="{ active: activeTab === tab.id }"
          @click="selectTab(tab.id)"
        >
          <span v-if="tab.icon" class="item-icon">{{ tab.icon }}</span>
          <span class="item-label">{{ tab.label }}</span>
        </button>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="tab-content" :class="{ 'content-animated': animated }">
      <slot :active-tab="activeTab"></slot>
    </div>

    <!-- Optional: Swipe indicator on mobile -->
    <div v-if="showSwipeIndicator && isMobile" class="swipe-indicator">
      {{ t('common.swipe_to_navigate') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

interface Tab {
  id: string
  label: string
  icon?: string
  badge?: string | number
}

interface Props {
  tabs: Tab[]
  modelValue?: string
  vertical?: boolean
  animated?: boolean
  showSwipeIndicator?: boolean
  breakpoint?: number
}

const props = withDefaults(defineProps<Props>(), {
  vertical: false,
  animated: true,
  showSwipeIndicator: true,
  breakpoint: 768,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const { t } = useI18n()

// Tab state
const activeTab = ref(props.modelValue || props.tabs[0]?.id || '')
const isMobile = ref(false)
const isDropdownOpen = ref(false)

// Track window size for responsive behavior
onMounted(() => {
  const updateMobileView = () => {
    isMobile.value = window.innerWidth < props.breakpoint
  }
  
  updateMobileView()
  window.addEventListener('resize', updateMobileView)
  
  return () => window.removeEventListener('resize', updateMobileView)
})

// Current tab label and icon (for dropdown)
const currentTab = computed(() => {
  return props.tabs.find(t => t.id === activeTab.value)
})

const currentTabLabel = computed(() => {
  return currentTab.value?.label || 'Select'
})

const currentTabIcon = computed(() => {
  return currentTab.value?.icon
})

// Select tab and close dropdown
const selectTab = (tabId: string) => {
  activeTab.value = tabId
  emit('update:modelValue', tabId)
  emit('change', tabId)
  isDropdownOpen.value = false
}

// Watchers
const modelValueWatcher = computed(() => props.modelValue)
// Update activeTab when modelValue changes externally
if (modelValueWatcher.value !== undefined) {
  if (modelValueWatcher.value !== activeTab.value) {
    activeTab.value = modelValueWatcher.value
  }
}
</script>

<style scoped lang="scss">
.tab-navigation-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

// Horizontal Tabs
.tabs-nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  &.horizontal {
    flex-direction: row;
    overflow-x: auto;

    [dir='rtl'] & {
      flex-direction: row-reverse;
    }

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-track {
      background: #f3f4f6;
    }

    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;

      &:hover {
        background: #9ca3af;
      }
    }
  }

  &.vertical {
    flex-direction: column;
    width: fit-content;
    padding: 1rem 0.5rem;
    border: 1px solid #e5e7eb;
  }
}

.tab-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 2px solid transparent;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  &:hover:not(.active) {
    background: #f3f4f6;
    color: #374151;
  }

  &.active {
    background: white;
    border-color: #2563eb;
    color: #2563eb;
    font-weight: 600;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
  }

  .tab-icon {
    font-size: 1.1rem;
  }

  .tab-label {
    white-space: nowrap;
  }

  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 0.4rem;
    background: #2563eb;
    color: white;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 700;
    margin-left: 0.5rem;

    [dir='rtl'] & {
      margin-left: 0;
      margin-right: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;

    .tab-label {
      display: none;
    }

    &.active .tab-label {
      display: inline;
    }
  }
}

// Mobile Dropdown
.tabs-dropdown {
  position: relative;
  width: 100%;
}

.dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.3s ease;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  &:hover {
    border-color: #2563eb;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.1);
  }

  .dropdown-icon {
    font-size: 1.1rem;
  }

  .dropdown-label {
    flex: 1;
    text-align: left;

    [dir='rtl'] & {
      text-align: right;
    }
  }

  .dropdown-arrow {
    font-size: 0.75rem;
    transition: transform 0.3s ease;

    &.open {
      transform: rotate(180deg);
    }
  }
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10;
  overflow: hidden;
  animation: slideDown 0.2s ease;

  [dir='rtl'] & {
    right: 0;
    left: auto;
  }
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.95rem;
  color: #6b7280;
  transition: all 0.2s ease;

  [dir='rtl'] & {
    flex-direction: row-reverse;
    text-align: right;
  }

  &:hover {
    background: #f9fafb;
    color: #374151;
  }

  &.active {
    background: #eff6ff;
    color: #2563eb;
    font-weight: 600;

    .item-icon {
      transform: scale(1.2);
    }
  }

  .item-icon {
    font-size: 1rem;
    transition: transform 0.2s ease;
  }

  .item-label {
    flex: 1;
  }
}

// Tab Content
.tab-content {
  width: 100%;
  animation: fadeIn 0.3s ease;

  &.content-animated {
    animation: slideIn 0.3s ease;
  }
}

// Swipe Indicator
.swipe-indicator {
  text-align: center;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-top: 0.5rem;
  animation: pulse 2s ease-in-out infinite;
}

// Animations
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
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

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

// Responsive
@media (max-width: 768px) {
  .tab-navigation-wrapper {
    &:not(.has-dropdown) {
      .tabs-nav {
        padding: 0;
        background: transparent;
        border: none;
      }

      .tab-button {
        flex: 1;
        border-radius: 0;
        border-bottom: 3px solid transparent;

        &.active {
          border-bottom-color: #2563eb;
          background: transparent;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .dropdown-menu {
    max-height: 300px;
    overflow-y: auto;
  }
}
</style>
