<template>
  <div class="narrative-card" :dir="textDirection">
    <div class="narrative-wrapper">
      <h3 v-if="title" class="narrative-title">{{ title }}</h3>
      <div class="narrative-body" v-html="highlightedBody"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  body: string
  highlightNumbers?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  highlightNumbers: true,
})

// Detect if text is Persian/Arabic (RTL)
const textDirection = computed(() => {
  const persianRegex = /[\u0600-\u06FF]/
  return persianRegex.test(props.body) ? 'rtl' : 'ltr'
})

// Highlight numbers in the body text
const highlightedBody = computed(() => {
  if (!props.highlightNumbers) {
    return props.body
  }

  // Replace numbers with highlighted spans
  // Support both Arabic (۰-۹) and Western (0-9) digits
  return props.body.replace(/(\d+(?:\.\d+)?|[\u06F0-\u06F9]+(?:٫[\u06F0-\u06F9]+)?)/g, (match) => {
    return `<span class="highlighted-number">${match}</span>`
  })
})
</script>

<style scoped lang="scss">
.narrative-card {
  padding: 1.5rem;
  background: rgb(var(--color-surface));
  border-radius: 0.5rem;
  border-left: 3px solid rgb(var(--color-info));
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;

  &[dir='rtl'] {
    border-left: none;
    border-right: 3px solid rgb(var(--color-info));
  }

  &:hover {
    box-shadow: 0 4px 12px rgb(var(--color-info) / 0.1);
    transform: translateY(-2px);
  }
}

.narrative-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.narrative-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: rgb(var(--color-primary));
  margin: 0;
  line-height: 1.5;
}

.narrative-body {
  font-size: 0.95rem;
  line-height: 1.8;
  color: rgb(var(--color-text-primary));
  word-break: break-word;

  &[dir='rtl'] {
    text-align: right;
  }

  &[dir='ltr'] {
    text-align: left;
  }
}

// Syntax highlighting for numbers
:deep(.highlighted-number) {
  background: linear-gradient(135deg, rgb(var(--color-warning-muted)) 0%, rgb(var(--color-warning) / 0.4) 100%);
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-weight: 600;
  color: rgb(var(--color-warning-hover));
  display: inline-block;
  transition: all 0.2s ease;

  &:hover {
    background: linear-gradient(135deg, rgb(var(--color-warning) / 0.4) 0%, rgb(var(--color-warning) / 0.55) 100%);
    box-shadow: 0 2px 4px rgb(var(--color-warning) / 0.2);
  }
}

// Responsive
@media (max-width: 768px) {
  .narrative-card {
    padding: 1rem;

    .narrative-title {
      font-size: 1.1rem;
    }

    .narrative-body {
      font-size: 0.9rem;
      line-height: 1.6;
    }
  }
}
</style>
