<template>
  <div class="error-boundary">
    <!-- Error State -->
    <div v-if="hasError" class="error-container" role="alert" aria-live="polite">
      <div class="error-content">
        <div class="error-icon">⚠️</div>
        <h2 class="error-title">{{ t('common.error_occurred') }}</h2>
        <p class="error-message">{{ errorMessage }}</p>

        <div class="error-actions">
          <button
            class="btn btn-primary"
            @click="resetError"
            :aria-label="t('common.retry')"
          >
            {{ t('common.retry') }}
          </button>
          <button
            class="btn btn-secondary"
            @click="goHome"
            :aria-label="t('common.go_home')"
          >
            {{ t('common.go_home') }}
          </button>
        </div>

        <!-- Error Details (Dev Mode) -->
        <details v-if="isDevelopment" class="error-details">
          <summary>{{ t('common.error_details') }}</summary>
          <pre>{{ errorStack }}</pre>
        </details>
      </div>
    </div>

    <!-- Normal Content -->
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { AppError, logError, getUserErrorMessage, isCriticalError } from '@/utils/errorHandler'

const { t } = useI18n()
const router = useRouter()

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Error capture for Vue components
 */
onErrorCaptured((error: any, instance, info) => {
  const appError = error instanceof AppError
    ? error
    : new AppError(
        error?.message || 'Unknown error',
        getUserErrorMessage(error),
        'COMPONENT_ERROR',
        500,
        { componentInfo: info }
      )

  logError(appError, { componentInfo: info })

  errorMessage.value = appError.userMessage
  errorStack.value = error?.stack || appError.message
  hasError.value = true

  // Only prevent default for non-critical errors
  return !isCriticalError(appError)
})

/**
 * Reset error state
 */
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
  errorStack.value = ''
}

/**
 * Navigate to home
 */
const goHome = async () => {
  resetError()
  await router.push('/')
}
</script>

<style scoped lang="scss">
@import '@/styles/variables';

.error-boundary {
  width: 100%;
  min-height: 100vh;
}

.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: $space-6;
  background: linear-gradient(135deg, rgb(var(--color-surface-hover)) 0%, rgb(var(--color-neutral-muted)) 100%);

  [data-theme='dark'] & {
    background: linear-gradient(135deg, rgb(var(--color-background)) 0%, rgb(var(--color-surface-subtle)) 100%);
  }
}

.error-content {
  background: rgb(var(--color-surface));
  border-radius: $radius-lg;
  padding: $space-10;
  max-width: 500px;
  box-shadow: $shadow-xl;
  text-align: center;

  [data-theme='dark'] & {
    background: rgb(var(--color-surface));
  }
}

.error-icon {
  font-size: 64px;
  margin-bottom: $space-6;
  display: inline-block;
  animation: bounce 0.6s ease-in-out infinite;
}

.error-title {
  @include font-h2;
  color: rgb(var(--color-error));
  margin-bottom: $space-4;
}

.error-message {
  @include font-body;
  color: var(--text-secondary);
  margin-bottom: $space-8;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: $space-4;
  justify-content: center;
  margin-bottom: $space-6;

  @include media-sm {
    flex-direction: column;
  }

  .btn {
    flex: 1;

    @include media-sm {
      width: 100%;
    }
  }
}

.error-details {
  border: 1px solid var(--border-color);
  border-radius: $radius-md;
  padding: $space-4;
  background: var(--bg-secondary);
  text-align: left;

  summary {
    cursor: pointer;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    user-select: none;

    &:hover {
      color: rgb(var(--color-primary));
    }
  }

  pre {
    margin-top: $space-4;
    padding: $space-4;
    background: #1e1e1e;
    color: #d4d4d4;
    border-radius: $radius-sm;
    overflow-x: auto;
    font-size: $font-size-xs;
    font-family: 'Courier New', monospace;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
