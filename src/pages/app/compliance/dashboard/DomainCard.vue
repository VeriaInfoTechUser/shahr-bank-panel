<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Lucide from '@/base-components/Lucide/Lucide.vue';

interface DomainData {
  title: string;
  slug: string;
  total_count: number;
  '0'?: number | null;
  '50'?: number | null;
  '100'?: number | null;
  average?: number | string | null;
  in_progress_count?: number | null;
}

const props = defineProps<{
  domain: DomainData;
  highlight?: boolean;
  cardType?: 'top-performing' | 'standard';
}>();

const { t } = useI18n();

/** Calculate completion percentages */
const stats = computed(() => {
  const total = props.domain.total_count || 0;
  const completed = props.domain['100'] || 0;
  const partial = props.domain['50'] || 0;
  const notStarted = props.domain['0'] || 0;
  const inProgress = props.domain.in_progress_count || 0;

  return {
    total,
    completed,
    partial,
    notStarted,
    inProgress,
    completedPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    partialPercent: total > 0 ? Math.round((partial / total) * 100) : 0,
    notStartedPercent: total > 0 ? Math.round((notStarted / total) * 100) : 0,
    inProgressPercent: total > 0 ? Math.round((inProgress / total) * 100) : 0,
  };
});

/** Status badge styling */
const statusColor = computed(() => {
  const percent = stats.value.completedPercent;
  if (percent === 100) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10';
  if (percent >= 75) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10';
  if (percent >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10';
  return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10';
});

const statusIcon = computed(() => {
  const percent = stats.value.completedPercent;
  if (percent === 100) return 'CheckCircle2';
  if (percent >= 75) return 'TrendingUp';
  if (percent >= 50) return 'Clock';
  return 'AlertCircle';
});

const cardTypeLabel = computed(() =>
  props.cardType === 'top-performing'
    ? t('compliance-dashboard.card-type-top-performing')
    : t('compliance-dashboard.card-type-standard')
);

const cardTypeBadgeClass = computed(() =>
  props.cardType === 'top-performing'
    ? 'bg-primary/10 text-primary ring-1 ring-primary/20 dark:bg-primary/20 dark:text-primary/90 dark:ring-primary/30'
    : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 dark:bg-darkmode-700 dark:text-slate-300 dark:ring-darkmode-600'
);
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden rounded-2xl border shadow-sm transition',
      highlight
        ? 'border-primary/40 bg-gradient-to-br from-primary/5 to-primary/2 dark:border-primary/50 dark:from-primary/15 dark:to-primary/5'
        : 'border-slate-200/90 bg-white dark:border-darkmode-600 dark:bg-darkmode-800'
    ]"
  >
    <!-- Background gradient accent -->
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50/0 to-slate-50/40 dark:from-transparent dark:to-darkmode-900/20"
    />

    <!-- Content -->
    <div class="relative p-5 md:p-6">
      <!-- Header -->
      <div class="mb-5 flex items-start justify-between gap-4">
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span :class="['inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium', cardTypeBadgeClass]">
              {{ cardTypeLabel }}
            </span>
            <p class="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {{ domain.slug }}
            </p>
          </div>
          <h3 class="text-base font-semibold text-slate-900 dark:text-slate-50">
            {{ domain.title }}
          </h3>
        </div>
        <div :class="['shrink-0 rounded-lg p-2', statusColor]">
          <Lucide :icon="statusIcon" class="h-5 w-5" />
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="mb-5 space-y-2">
        <div class="flex items-end justify-between gap-2">
          <span class="text-xs font-medium text-slate-600 dark:text-slate-300">
            {{ t('compliance-dashboard.progress-label') }}
          </span>
          <span class="text-sm font-bold text-slate-900 dark:text-slate-50">
            {{ stats.completedPercent }}%
          </span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-darkmode-700">
          <div
            :style="{ width: `${stats.completedPercent}%` }"
            :class="[
              'h-full transition-all duration-500',
              stats.completedPercent === 100
                ? 'bg-green-500'
                : stats.completedPercent >= 75
                  ? 'bg-blue-500'
                  : stats.completedPercent >= 50
                    ? 'bg-amber-500'
                    : 'bg-red-500'
            ]"
          />
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg bg-slate-50/80 p-3 dark:bg-darkmode-700/50">
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('compliance-dashboard.total') }}</p>
          <p class="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">
            {{ stats.total }}
          </p>
        </div>
        <div class="rounded-lg bg-green-50/80 p-3 dark:bg-green-500/10">
          <p class="text-xs text-green-600 dark:text-green-400">{{ t('compliance-dashboard.completed') }}</p>
          <p class="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
            {{ stats.completed }}
          </p>
        </div>
        <div class="rounded-lg bg-amber-50/80 p-3 dark:bg-amber-500/10">
          <p class="text-xs text-amber-600 dark:text-amber-400">{{ t('compliance-dashboard.in-progress') }}</p>
          <p class="mt-1 text-lg font-bold text-amber-700 dark:text-amber-300">
            {{ stats.inProgress }}
          </p>
        </div>
        <div class="rounded-lg bg-slate-50/80 p-3 dark:bg-darkmode-700/50">
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ t('compliance-dashboard.not-started') }}</p>
          <p class="mt-1 text-lg font-bold text-slate-600 dark:text-slate-300">
            {{ stats.notStarted }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
