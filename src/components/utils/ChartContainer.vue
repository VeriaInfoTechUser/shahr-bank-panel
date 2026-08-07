<template>
  <div class="chart-container" :class="{ 'has-data': hasData, 'empty-state': !hasData }">
    <div v-if="title" class="chart-header">
      <h4 class="chart-title">{{ title }}</h4>
      <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    </div>

    <div class="chart-wrapper" :style="{ aspectRatio: aspectRatio }">
      <div v-if="hasData" class="chart-content" :style="responsiveStyles">
        <slot></slot>
      </div>
      <div v-else class="empty-placeholder">
        <span class="empty-icon">📊</span>
        <p class="empty-message">{{ t('common.no_data') }}</p>
      </div>
    </div>

    <div v-if="$slots.footer" class="chart-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  title?: string
  subtitle?: string
  data?: any
  aspectRatio?: string
  minHeight?: string
  maxWidth?: string
}

const props = withDefaults(defineProps<Props>(), {
  aspectRatio: '16 / 9',
  minHeight: '300px',
  maxWidth: '100%',
})

const { t } = useI18n()
const slots = useSlots()

// Detect if there's valid data
const hasData = computed(() => {
  if (!props.data) return !!slots.default
  if (Array.isArray(props.data)) return props.data.length > 0
  if (typeof props.data === 'object') return Object.keys(props.data).length > 0
  return !!props.data
})

// Responsive styles based on container size
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(0)

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
    
    // Watch for resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.value) {
        containerWidth.value = containerRef.value.offsetWidth
      }
    })
    
    resizeObserver.observe(containerRef.value)
  }
})

const responsiveStyles = computed(() => {
  return {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
})
</script>

<style scoped lang="scss">
.chart-container {
  width: 100%;
  max-width: v-bind('"' + maxWidth + '"');
  margin: 0 auto;
  padding: 1.5rem;
  background: rgb(var(--color-surface));
  border: 1px solid rgb(var(--color-border));
  border-radius: 0.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &.has-data {
    &:hover {
      box-shadow: var(--shadow-md);
    }
  }

  &.empty-state {
    .empty-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      color: rgb(var(--color-text-muted));

      .empty-icon {
        font-size: 3rem;
        opacity: 0.3;
      }

      .empty-message {
        margin: 0;
        font-size: 1rem;
        font-style: italic;
      }
    }
  }
}

.chart-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgb(var(--color-border));

  .chart-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: rgb(var(--color-text-primary));
    margin: 0;
  }

  .chart-subtitle {
    font-size: 0.85rem;
    color: rgb(var(--color-text-secondary));
    margin: 0;
  }
}

.chart-wrapper {
  width: 100%;
  aspect-ratio: v-bind('"' + aspectRatio + '"');
  min-height: v-bind('"' + minHeight + '"');
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(var(--color-surface-hover)) 0%, rgb(var(--color-neutral-muted)) 100%);
  border-radius: 0.375rem;
  overflow: hidden;
  position: relative;

  .chart-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

    &::slotted(*) {
      width: 100%;
      height: 100%;
    }
  }
}

.chart-footer {
  padding-top: 0.5rem;
  border-top: 1px solid rgb(var(--color-border));
  font-size: 0.85rem;
  color: rgb(var(--color-text-secondary));
}

// Responsive
@media (max-width: 768px) {
  .chart-container {
    padding: 1rem;
    gap: 0.75rem;
  }

  .chart-header {
    padding-bottom: 0.75rem;

    .chart-title {
      font-size: 1rem;
    }

    .chart-subtitle {
      font-size: 0.8rem;
    }
  }

  .chart-wrapper {
    min-height: 250px;
  }
}

@media (max-width: 480px) {
  .chart-container {
    padding: 0.75rem;
    border-radius: 0.375rem;
  }

  .chart-wrapper {
    min-height: 200px;
    border-radius: 0.25rem;
  }
}
</style>
