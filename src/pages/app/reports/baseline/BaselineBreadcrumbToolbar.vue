<script setup lang="ts">
const props = defineProps<{
  onAdd?: () => void;
  onExport?: () => void;
}>();
</script>

<template>
  <div class="flex flex-shrink-0 items-center gap-1.5">
    <button
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-slate-100"
      aria-label="Export"
      title="Export"
      @click="onExport?.()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>
    <button
      v-if="onAdd"
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-primary bg-primary text-white shadow-sm transition hover:opacity-90 dark:border-primary dark:bg-primary dark:hover:opacity-90"
      aria-label="Add"
      title="Add"
      @click="onAdd?.()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  </div>
</template>
