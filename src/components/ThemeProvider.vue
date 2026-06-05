<template>
  <div class="theme-provider" :data-theme="currentTheme">
    <slot></slot>
    
    <!-- Optional: Theme Toggle Button (can be disabled) -->
    <div v-if="showToggle" class="theme-toggle-fab">
      <button 
        class="theme-toggle-btn"
        @click="toggleTheme"
        :title="currentTheme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
      >
        <span v-if="currentTheme === 'light'" class="toggle-icon">🌙</span>
        <span v-else class="toggle-icon">☀️</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

interface Props {
  initialTheme?: 'light' | 'dark' | 'auto'
  showToggle?: boolean
  storageKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialTheme: 'auto',
  showToggle: false,
  storageKey: 'app-theme',
})

const emit = defineEmits<{
  'theme-change': [theme: 'light' | 'dark']
}>()

const currentTheme = ref<'light' | 'dark'>('light')

// Initialize theme on mount
onMounted(() => {
  // Check localStorage first
  const stored = localStorage.getItem(props.storageKey) as 'light' | 'dark' | null
  
  if (stored) {
    currentTheme.value = stored
  } else if (props.initialTheme === 'auto') {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    currentTheme.value = prefersDark ? 'dark' : 'light'
  } else {
    currentTheme.value = props.initialTheme
  }

  // Set initial theme
  applyTheme(currentTheme.value)

  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    if (props.initialTheme === 'auto') {
      currentTheme.value = e.matches ? 'dark' : 'light'
      applyTheme(currentTheme.value)
    }
  })
})

// Watch for theme changes
watch(currentTheme, (newTheme) => {
  applyTheme(newTheme)
  localStorage.setItem(props.storageKey, newTheme)
  emit('theme-change', newTheme)
})

// Apply theme to document
const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

// Toggle theme
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light' ? 'dark' : 'light'
}
</script>

<style scoped lang="scss">
@import 'variables';

.theme-provider {
  width: 100%;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color $transition-base, color $transition-base;
}

// Theme Toggle FAB
.theme-toggle-fab {
  position: fixed;
  bottom: $space-6;
  right: $space-6;
  z-index: 999;

  [dir='rtl'] & {
    right: auto;
    left: $space-6;
  }
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: $radius-full;
  border: none;
  background-color: var(--color-primary);
  color: white;
  cursor: pointer;
  box-shadow: $shadow-lg;
  transition: all $transition-base;
  font-size: $font-size-xl;

  &:hover {
    transform: scale(1.1);
    box-shadow: $shadow-xl;
  }

  &:active {
    transform: scale(0.95);
  }

  .toggle-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    animation: rotate 0.5s ease;
  }
}

@keyframes rotate {
  from {
    transform: rotate(-180deg);
  }
  to {
    transform: rotate(0deg);
  }
}

// Responsive
@media (max-width: 768px) {
  .theme-toggle-fab {
    bottom: $space-4;
    right: $space-4;

    [dir='rtl'] & {
      right: auto;
      left: $space-4;
    }
  }

  .theme-toggle-btn {
    width: 48px;
    height: 48px;
    font-size: $font-size-lg;
  }
}
</style>
