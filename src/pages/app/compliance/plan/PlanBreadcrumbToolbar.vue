<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, nextTick, onUnmounted, ref, toValue, watch } from 'vue';
import { useElementBounding, onClickOutside, useEventListener } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide';
import PlanFilterPanel from './PlanFilterPanel.vue';
import {
  PLAN_FILTER_PARAM_LABEL_KEYS,
  getActivePlanFilterKeys,
  type PlanFilterParamKey,
} from './planFilterToolbarKeys';

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

const activeFilterKeys = computed((): PlanFilterParamKey[] =>
  getActivePlanFilterKeys(toValue(props.table.filters) ?? {})
);

function clearFiltersFromToolbar() {
  props.table.clearFilters();
  filterToolbarClearTick.value += 1;
}

function removeFilterParam(key: PlanFilterParamKey) {
  const f = { ...(toValue(props.table.filters) ?? {}) };
  delete f[key];
  props.table.replaceFilters(f);
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
        () => {
          closeFilter();
        },
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
      :aria-label="t('plan.toolbar-add')"
      :title="t('plan.toolbar-add')"
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
      :aria-label="t('plan.toolbar-export')"
      :title="t('plan.toolbar-export')"
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
          :aria-label="t('plan.toolbar-filter')"
          :aria-expanded="filterOpen"
          :title="t('plan.toolbar-filter')"
          @click="toggleFilter"
        >
          <Lucide icon="Filter" class="h-4 w-4" />
        </button>
        <button
          v-if="hasActiveFilters"
          type="button"
          class="inline-flex h-8 max-w-[min(100%,12rem)] shrink-0 items-center rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-primary dark:border-darkmode-600 dark:bg-darkmode-800 dark:text-slate-300 dark:hover:bg-darkmode-700 dark:hover:text-primary"
          :aria-label="t('plan.toolbar-clear-filters')"
          :title="t('plan.toolbar-clear-filters')"
          @click="clearFiltersFromToolbar"
        >
          <span class="truncate">{{ t('plan.toolbar-clear-filters') }}</span>
        </button>
      </div>
      <div
        v-if="activeFilterKeys.length > 0"
        class="mx-1.5 flex min-w-0 flex-wrap items-center gap-2 sm:mx-2"
      >
        <div
          class="h-8 w-1 shrink-0 self-center rounded-full bg-slate-500 dark:bg-slate-400"
          aria-hidden="true"
        />
        <div class="flex min-w-0 flex-wrap items-center gap-1">
          <span
            v-for="key in activeFilterKeys"
            :key="key"
            class="inline-flex max-w-[11rem] items-center gap-0.5 rounded-full border border-slate-200 bg-slate-50 py-0.5 pl-2 pr-0.5 text-[11px] font-medium text-slate-700 shadow-sm dark:border-darkmode-600 dark:bg-darkmode-700/80 dark:text-slate-200"
          >
            <span class="min-w-0 truncate" :title="t(PLAN_FILTER_PARAM_LABEL_KEYS[key])">{{
              t(PLAN_FILTER_PARAM_LABEL_KEYS[key])
            }}</span>
            <button
              type="button"
              class="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-darkmode-600 dark:hover:text-slate-100"
              :aria-label="
                t('plan.filter-badge-remove-aria', { label: t(PLAN_FILTER_PARAM_LABEL_KEYS[key]) })
              "
              :title="
                t('plan.filter-badge-remove-aria', { label: t(PLAN_FILTER_PARAM_LABEL_KEYS[key]) })
              "
              @click.stop="removeFilterParam(key)"
            >
              <Lucide icon="X" class="!h-3 !w-3" />
            </button>
          </span>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="plan-filter-pop">
        <div
          v-if="filterOpen"
          class="fixed inset-0 z-[1099] bg-slate-900/10 dark:bg-black/25"
          aria-hidden="true"
          @click="closeFilter"
        />
      </Transition>
      <Transition name="plan-filter-pop">
        <div
          v-if="filterOpen"
          ref="popoverRef"
          class="max-h-[min(70vh,32rem)] overflow-y-auto overscroll-contain rounded-xl border border-slate-200/90 bg-white p-4 shadow-xl dark:border-darkmode-600 dark:bg-darkmode-800 dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          :style="popoverStyle"
          role="dialog"
          aria-modal="true"
          :aria-label="t('plan.filter-panel-title')"
          @click.stop
        >
          <PlanFilterPanel
            :table="table"
            :toolbar-clear-tick="filterToolbarClearTick"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.plan-filter-pop-enter-active,
.plan-filter-pop-leave-active {
  transition: opacity 0.15s ease;
}
.plan-filter-pop-enter-from,
.plan-filter-pop-leave-to {
  opacity: 0;
}
</style>
