<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide';

const props = defineProps<{
  onAdd?: () => void;
  onExport?: () => void;
  onFilter?: () => void;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
}>();

const { t } = useI18n();
</script>

<template>
  <div class="relative flex flex-shrink-0 flex-wrap items-center gap-1.5" dir="ltr">
    <button
      v-if="onAdd"
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-primary bg-primary text-white shadow-sm transition hover:opacity-90 dark:border-primary dark:bg-primary dark:hover:opacity-90"
      :aria-label="t('structured-data.toolbar-add')"
      :title="t('structured-data.toolbar-add')"
      @click="onAdd?.()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>

    <button
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-slate-100"
      :aria-label="t('structured-data.toolbar-export')"
      :title="t('structured-data.toolbar-export')"
      @click="onExport?.()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>

    <div class="flex shrink-0 items-center gap-1">
      <button
        type="button"
        class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-primary"
        :aria-label="t('structured-data.toolbar-filter')"
        :title="t('structured-data.toolbar-filter')"
        @click="onFilter?.()"
      >
        <Lucide icon="Filter" class="h-4 w-4" />
      </button>
      <button
        v-if="hasActiveFilters"
        type="button"
        class="inline-flex h-8 max-w-[min(100%,12rem)] shrink-0 items-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-primary"
        :aria-label="t('structured-data.toolbar-clear-filters')"
        :title="t('structured-data.toolbar-clear-filters')"
        @click="onClearFilters?.()"
      >
        <span class="truncate">{{ t('structured-data.toolbar-clear-filters') }}</span>
      </button>
    </div>
  </div>
</template>
