<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { toast } from 'vue3-toastify';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';
import { grcRepo } from '@/core/repositories/grcRepo';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(true);
const indicator = ref<Record<string, unknown> | null>(null);

const slug = computed(() => route.params.slug as string);

async function fetchIndicator() {
  loading.value = true;
  try {
    const res = await grcRepo.indicatorGet(slug.value);
    if (res?.result && res.data) {
      indicator.value = res.data as Record<string, unknown>;
    } else {
      toast(t('general.error'), { type: 'error' });
      goBack();
    }
  } catch {
    toast(t('general.error'), { type: 'error' });
    goBack();
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: 'app-sustainability-indicator' });
}

function goToEdit() {
  router.push({ name: 'app-sustainability-indicator-edit', params: { slug: slug.value } });
}

function getField(label: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

onMounted(() => {
  fetchIndicator();
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/80 to-primary-muted/10 p-6 dark:from-darkmode-900 dark:via-darkmode-800 dark:to-primary-muted/5">
    <div class="mx-auto max-w-5xl">
      <!-- Header -->
      <div class="mb-6 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg shadow-primary/5 dark:border-darkmode-700/40 dark:bg-darkmode-800 dark:shadow-black/10">
        <div class="border-b border-slate-100 bg-gradient-to-r from-primary/5 via-transparent to-primary-muted/10 px-6 py-4 dark:border-darkmode-700/50 dark:from-primary/10 dark:to-primary-muted/5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-darkmode-700" @click="goBack">
                <Lucide icon="ArrowRight" class="h-4 w-4" />
              </button>
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/20">
                <Lucide icon="BarChart3" class="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 class="text-lg font-semibold text-slate-800 dark:text-slate-100">{{ t('sustainability-indicator-page.detail') }}</h1>
                <p v-if="indicator" class="text-sm text-slate-500 dark:text-slate-400">{{ indicator.title }}</p>
              </div>
            </div>
            <Button variant="primary" size="sm" class="!rounded-lg" @click="goToEdit">
              <Lucide icon="Pencil" class="h-4 w-4 ms-1" />
              {{ t('title.update') }}
            </Button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-16">
          <div class="h-8 w-8 animate-spin rounded-full border-3 border-slate-300 border-t-primary"></div>
        </div>

        <!-- Content -->
        <div v-else-if="indicator" class="p-6 space-y-6">
          <!-- Basic Info -->
          <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/30">
            <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{{ t('sustainability-indicator-page.section-basic') }}</h3>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-slug') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.slug) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-title') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.title) }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-title-en') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.titleEn) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-version') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.version) }}</p>
              </div>
            </div>
          </div>

          <!-- Tree Structure -->
          <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/30">
            <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{{ t('sustainability-indicator-page.section-tree') }}</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-capital') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.capitalTitle) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-domain') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.domainTitle) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-component') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.componentTitle) }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-capability') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.capabilityTitle) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-claim') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.claimTitle) }}</p>
              </div>
            </div>
          </div>

          <!-- Indicator Properties -->
          <div class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-darkmode-600 dark:bg-darkmode-700/30">
            <h3 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">{{ t('sustainability-indicator-page.section-properties') }}</h3>
            <div class="grid grid-cols-4 gap-4">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-indicator-type') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.indicatorType) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-metric-type') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.metricType) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-metric-role') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.metricRole) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-data-type') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.dataType) }}</p>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4 mt-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-unit') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.unit) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-direction') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.direction) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-frequency') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.frequency) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-calculation-type') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.calculationType) }}</p>
              </div>
            </div>
            <div class="grid grid-cols-4 gap-4 mt-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-min-value') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.minValue) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-max-value') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.maxValue) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-annual-target') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.annualTarget) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-target-year') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.targetYear) }}</p>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4 mt-3">
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-data-owner') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.dataOwner) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-data-source') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.dataSource) }}</p>
              </div>
              <div>
                <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-reporting-period') }}</label>
                <p class="text-sm text-slate-700 dark:text-slate-300">{{ getField('', indicator.reportingPeriod) }}</p>
              </div>
            </div>
            <div v-if="indicator.sustainabilityGoal" class="mt-3">
              <label class="text-[10px] uppercase tracking-wider text-slate-400">{{ t('sustainability-indicator-page.col-sustainability-goal') }}</label>
              <p class="text-sm text-slate-700 dark:text-slate-300">{{ indicator.sustainabilityGoal }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
