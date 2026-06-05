<template>
  <div class="metric-card-wrapper" :class="colorClass">
    <div class="metric-card-header">
      <div class="metric-info">
        <h4 class="metric-title">{{ title }}</h4>
        <p v-if="subtitle" class="metric-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="showTrend" class="trend-indicator" :class="trendClass">
        <span class="trend-icon">{{ trendIcon }}</span>
        <span class="trend-value">{{ trendValue }}%</span>
      </div>
    </div>

    <div class="metric-body">
      <div class="metric-value">
        {{ formattedValue }}
        <span v-if="unit" class="metric-unit">{{ unit }}</span>
      </div>
      <p v-if="description" class="metric-description">{{ description }}</p>
    </div>

    <div v-if="$slots.footer" class="metric-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  title: string
  value: number | string
  unit?: string
  subtitle?: string
  description?: string
  showTrend?: boolean
  trendValue?: number
  trendType?: 'up' | 'down' | 'neutral'
  valueRange?: {
    high: number
    medium: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  showTrend: false,
  trendValue: 0,
  trendType: 'neutral',
  valueRange: () => ({ high: 75, medium: 50 }),
})

const { locale } = useI18n()

// Format number based on locale and value range color
const formattedValue = computed(() => {
  const num = typeof props.value === 'number' ? props.value : parseFloat(props.value as string)
  
  if (isNaN(num)) return props.value

  return new Intl.NumberFormat(locale.value === 'fa' ? 'fa-IR' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num)
})

// Determine color class based on value range
const colorClass = computed(() => {
  const num = typeof props.value === 'number' ? props.value : parseFloat(props.value as string)
  
  if (isNaN(num)) return 'neutral-value'
  
  if (num >= props.valueRange.high) return 'high-value'
  if (num >= props.valueRange.medium) return 'medium-value'
  return 'low-value'
})

// Trend indicator
const trendIcon = computed(() => {
  if (props.trendType === 'up') return '📈'
  if (props.trendType === 'down') return '📉'
  return '→'
})

const trendClass = computed(() => {
  return `trend-${props.trendType}`
})
</script>

<style scoped lang="scss">
.metric-card-wrapper {
  padding: 1.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  // Color classes based on value range
  &.high-value {
    border-left: 3px solid #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, white 100%);

    [dir='rtl'] & {
      border-left: none;
      border-right: 3px solid #10b981;
    }

    .metric-value {
      color: #059669;
    }
  }

  &.medium-value {
    border-left: 3px solid #f59e0b;
    background: linear-gradient(135deg, #fffbeb 0%, white 100%);

    [dir='rtl'] & {
      border-left: none;
      border-right: 3px solid #f59e0b;
    }

    .metric-value {
      color: #b45309;
    }
  }

  &.low-value {
    border-left: 3px solid #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, white 100%);

    [dir='rtl'] & {
      border-left: none;
      border-right: 3px solid #ef4444;
    }

    .metric-value {
      color: #b91c1c;
    }
  }

  &.neutral-value {
    border-left: 3px solid #6b7280;

    [dir='rtl'] & {
      border-left: none;
      border-right: 3px solid #6b7280;
    }

    .metric-value {
      color: #374151;
    }
  }
}

.metric-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }
}

.metric-info {
  flex: 1;
}

.metric-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.25rem 0;
}

.metric-subtitle {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 0;
}

.trend-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;

  [dir='rtl'] & {
    flex-direction: row-reverse;
  }

  .trend-icon {
    font-size: 1.1rem;
  }

  .trend-value {
    font-size: 0.9rem;
  }

  &.trend-up {
    background: #ecfdf5;
    color: #059669;
  }

  &.trend-down {
    background: #fef2f2;
    color: #dc2626;
  }

  &.trend-neutral {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.metric-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-value {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;

  .metric-unit {
    font-size: 1rem;
    margin-top: 0.5rem;
    opacity: 0.7;

    [dir='rtl'] & {
      margin-left: 0.5rem;
      margin-right: 0;
    }
  }
}

.metric-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.metric-footer {
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

// Responsive
@media (max-width: 768px) {
  .metric-card-wrapper {
    padding: 1rem;
    gap: 0.75rem;

    .metric-value {
      font-size: 2rem;
    }
  }

  .metric-card-header {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
