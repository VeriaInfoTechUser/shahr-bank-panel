<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  onAddPrimary?: () => void;
  onAddSecondary?: () => void;
  onAddCapability?: () => void;
  onExport?: () => void;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="relative flex flex-shrink-0 flex-wrap items-center gap-1.5" dir="ltr">
    <button
      type="button"
      class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-primary bg-primary px-2.5 text-xs font-medium text-white shadow-sm transition hover:opacity-90 dark:border-primary dark:bg-primary dark:hover:opacity-90"
      :aria-label="t('job.toolbar-add-primary')"
      :title="t('job.toolbar-add-primary')"
      @click="props.onAddPrimary?.()"
    >
      <span>{{ t('job.toolbar-add-primary') }}</span>
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <button
      type="button"
      class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-2.5 text-xs font-medium text-white shadow-sm transition hover:opacity-90 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:opacity-90"
      :aria-label="t('job.toolbar-add-secondary')"
      :title="t('job.toolbar-add-secondary')"
      @click="props.onAddSecondary?.()"
    >
      <span>{{ t('job.toolbar-add-secondary') }}</span>
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <button
      type="button"
      class="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-violet-600 bg-violet-600 px-2.5 text-xs font-medium text-white shadow-sm transition hover:opacity-90 dark:border-violet-500 dark:bg-violet-500 dark:hover:opacity-90"
      :aria-label="t('job.toolbar-add-capability')"
      :title="t('job.toolbar-add-capability')"
      @click="props.onAddCapability?.()"
    >
      <span>{{ t('job.toolbar-add-capability') }}</span>
      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <button
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-slate-100"
      :aria-label="t('job.toolbar-export')"
      :title="t('job.toolbar-export')"
      @click="props.onExport?.()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
  </div>
</template>
