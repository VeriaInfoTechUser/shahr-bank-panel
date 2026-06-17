<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, nextTick, onUnmounted, ref, toValue, watch } from 'vue';
import { useElementBounding, onClickOutside, useEventListener } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide';
import RiskListFilterPanel from './RiskListFilterPanel.vue';

const props = defineProps<{
  onAdd?: () => void;
  onExport?: () => void;
  table: {
    replaceFilters: (f: Record<string, unknown>) => void;
    clearFilters: () => void;
    filters: Ref<Record<string, unknown>> | Record<string, unknown>;
  };
}>();

const { t } = useI18n();

const filterOpen = ref(false);
const filterToolbarClearTick = ref(0);

const hasActiveFilters = computed(() => Object.keys(toValue(props.table.filters) ?? {}).length > 0);

function clearFiltersFromToolbar() {
  props.table.clearFilters();
  filterToolbarClearTick.value += 1;
}

const filterBtnRef = ref<HTMLElement | null>(null);
const filterToolbarClusterRef = ref<HTMLElement | null>(null);
const popoverRef = ref<HTMLElement | null>(null);

const bound = useElementBounding(filterBtnRef, { windowScroll: true, windowResize: true });

const popoverStyle = computed(() => {
  const margin = 8;
  const maxW = Math.min(28 * 16, window.innerWidth - 2 * margin);
  let leftPos = bound.left.value;
  if (leftPos + maxW > window.innerWidth - margin) {
    leftPos = Math.max(margin, window.innerWidth - margin - maxW);
  }
  if (leftPos < margin) leftPos = margin;
  return {
    position: 'fixed' as const,
    top: `${bound.bottom.value + margin}px`,
    left: `${leftPos}px`,
    width: `${maxW}px`,
    zIndex: 1100,
  };
});

function toggleFilter() {
  filterOpen.value = !filterOpen.value;
}

function closeFilter() {
  filterOpen.value = false;
}

let stopClickOutside: (() => void) | undefined;

watch(filterOpen, (open) => {
  stopClickOutside?.();
  stopClickOutside = undefined;
  if (open) {
    void nextTick(() => {
      bound.update();
      stopClickOutside = onClickOutside(
        popoverRef,
        () => { closeFilter(); },
        {
          ignore: [
            filterToolbarClusterRef,
            '.base-select-overlay-panel',
            '.base-multiselect-overlay-panel',
            '.p-select-overlay',
            '.p-multiselect-overlay',
          ],
        }
      );
    });
  }
});

onUnmounted(() => {
  stopClickOutside?.();
});

useEventListener(document, 'keydown', (e: KeyboardEvent) => {
  if (e.key === 'Escape' && filterOpen.value) closeFilter();
});
</script>

<template>
  <div class="relative flex flex-shrink-0 flex-wrap items-center gap-1.5" dir="ltr">
    <button
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-primary bg-primary text-white shadow-sm transition hover:opacity-90 dark:border-primary dark:bg-primary dark:hover:opacity-90"
      :aria-label="t('risk.toolbar-add')"
      :title="t('risk.toolbar-add')"
      @click="props.onAdd?.()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
    <button
      type="button"
      class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-slate-100"
      :aria-label="t('risk.toolbar-export')"
      :title="t('risk.toolbar-export')"
      @click="props.onExport?.()"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    </button>

    <div
      ref="filterToolbarClusterRef"
      class="flex max-w-[min(100vw-6rem,36rem)] flex-shrink-0 flex-wrap items-center gap-0.5"
    >
      <div class="flex shrink-0 items-center gap-1">
        <button
          ref="filterBtnRef"
          type="button"
          class="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-primary"
          :aria-label="t('risk.toolbar-filter')"
          :aria-expanded="filterOpen"
          :title="t('risk.toolbar-filter')"
          @click="toggleFilter"
        >
          <Lucide icon="Filter" class="h-4 w-4" />
        </button>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="inline-flex h-8 max-w-[min(100%,12rem)] shrink-0 items-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-primary"
          :aria-label="t('risk.toolbar-clear-filters')"
          :title="t('risk.toolbar-clear-filters')"
          @click="clearFiltersFromToolbar"
        >
          <span class="truncate">{{ t('risk.toolbar-clear-filters') }}</span>
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="risk-filter-pop">
        <div
          v-if="filterOpen"
          class="fixed inset-0 z-[1099] bg-slate-900/10 dark:bg-black/25"
          aria-hidden="true"
          @click="closeFilter"
        />
      </Transition>
      <Transition name="risk-filter-pop">
        <div
          v-if="filterOpen"
          ref="popoverRef"
          class="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200/90 bg-white p-4 shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          :style="popoverStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="t('risk.filter-panel-title')"
          @click.stop
        >
          <RiskListFilterPanel
            :table="table"
            :toolbar-clear-tick="filterToolbarClearTick"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.risk-filter-pop-enter-active,
.risk-filter-pop-leave-active {
  transition: opacity 0.15s ease;
}
.risk-filter-pop-enter-from,
.risk-filter-pop-leave-to {
  opacity: 0;
}
</style>
