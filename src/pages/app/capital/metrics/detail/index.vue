<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { grcRepo } from '@/core/repositories/grcRepo';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';

interface FrameworkMapping {
  mappedTitle: string;
  frameworkName: string;
  mappedControlId: string;
}

interface CascadingEffect {
  description: string;
  effectDirection: string;
  targetMetricId: string;
  relationshipType: string;
}

interface MetricInformation {
  unit: string;
  title: string;
  number: string;
  formula: string;
  version: string;
  dataType: string;
  isActive: boolean;
  dataOwner: string;
  direction: string;
  dataSource: string;
  industries: string[];
  metricRole: string;
  metricType: string;
  targetYear: number;
  description: string;
  annualTarget: string;
  categorySlug: string;
  hasSubAssets: boolean;
  categoryTitle: string;
  calculationType: string;
  categorySubSlug: string;
  reportingPeriod: string;
  sourceAssetType: string;
  categorySubTitle: string;
  warningThreshold: string;
  criticalThreshold: string;
  frameworkMappings: FrameworkMapping[];
  spatialAggregation: string;
  sustainabilityGoal: string;
  collectionFrequency: string;
  temporalAggregation: string;
  associatedIndustries: string[];
  dynamicAggregationRule: string;
  cascadingEffectsAndRisks: CascadingEffect[];
  adaptiveResilienceTestType: string;
}

interface MetricDetail {
  id: string;
  slug: string;
  type: string;
  source: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  information: MetricInformation;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref<boolean>(false);
const metric = ref<MetricDetail | null>(null);

const info = computed<MetricInformation | null>(() => metric.value?.information ?? null);

async function fetchMetric(): Promise<void> {
  const slug = route.params.slug as string | undefined;
  if (!slug) return;
  loading.value = true;
  try {
    const res = await grcRepo.metricsGet(slug);
    if (res?.result && res.data) {
      metric.value = res.data as unknown as MetricDetail;
    } else {
      metric.value = null;
    }
  } catch {
    metric.value = null;
  } finally {
    loading.value = false;
  }
}

function goBack(): void {
  router.push({ name: 'app-capital-metrics' });
}

onMounted(() => {
  void fetchMetric();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50/50 dark:bg-darkmode-900">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-32">
      <div class="flex flex-col items-center gap-3">
        <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span class="text-xs text-slate-400">{{ t('general.loading') }}</span>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!info" class="flex items-center justify-center py-32">
      <div class="text-center">
        <Lucide icon="FileX" class="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p class="text-sm text-slate-400">{{ t('general.no-data') }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="mx-auto max-w-5xl space-y-5 px-1 pb-6 pt-4 md:px-2">
      <!-- Hero header -->
      <div
        class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
      >
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

        <div class="relative p-6">
          <!-- Top row: breadcrumbs + back -->
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span>{{ info.categoryTitle }}</span>
              <Lucide icon="ChevronLeft" class="h-3 w-3 rtl:rotate-180" />
              <span>{{ info.categorySubTitle }}</span>
            </div>
            <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="!h-8 !gap-1.5 !px-3 !text-xs"
              @click="goBack"
            >
              <Lucide icon="ArrowRight" class="h-3.5 w-3.5 ltr:hidden" />
              <Lucide icon="ArrowLeft" class="h-3.5 w-3.5 rtl:hidden" />
              {{ t('general.back') }}
            </Button>
          </div>

          <!-- Title row -->
          <div class="flex flex-wrap items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lucide icon="BarChart3" class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-darkmode-700 dark:text-slate-200"
                >
                  {{ info.number }}
                </span>
                <span class="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-darkmode-700 dark:text-slate-400">
                  v{{ info.version }}
                </span>
                <span
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold"
                  :class="info.isActive ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="info.isActive ? 'bg-emerald-500' : 'bg-red-500'" />
                  {{ info.isActive ? t('general.active') : t('general.inactive') }}
                </span>
                <span class="rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                  {{ info.metricType }}
                </span>
                <span class="rounded-lg bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  {{ info.metricRole }}
                </span>
              </div>
              <h1 class="mt-2.5 text-lg font-bold leading-snug text-slate-800 dark:text-slate-100">
                {{ info.title }}
              </h1>
            </div>
          </div>

          <!-- KPI strip -->
          <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div class="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-darkmode-700 dark:bg-darkmode-900/50">
              <div class="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <Lucide icon="Ruler" class="h-3 w-3" />
                {{ t('capital-metrics-page.col-unit') }}
              </div>
              <div class="mt-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">{{ info.unit }}</div>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-darkmode-700 dark:bg-darkmode-900/50">
              <div class="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <Lucide icon="Target" class="h-3 w-3" />
                {{ t('capital-metrics-page.annual-target') }}
              </div>
              <div class="mt-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">{{ info.annualTarget }}</div>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-darkmode-700 dark:bg-darkmode-900/50">
              <div class="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <Lucide icon="Calendar" class="h-3 w-3" />
                {{ t('capital-metrics-page.target-year') }}
              </div>
              <div class="mt-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">{{ info.targetYear }}</div>
            </div>
            <div class="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-darkmode-700 dark:bg-darkmode-900/50">
              <div class="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <Lucide icon="Compass" class="h-3 w-3" />
                {{ t('capital-metrics-page.col-direction') }}
              </div>
              <div class="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-200">
                <Lucide
                  :icon="info.direction === 'maximize' ? 'TrendingUp' : info.direction === 'minimize' ? 'TrendingDown' : 'Minus'"
                  class="h-4 w-4"
                  :class="info.direction === 'maximize' ? 'text-emerald-500' : info.direction === 'minimize' ? 'text-red-500' : 'text-slate-400'"
                />
                {{ info.direction }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
        <div class="mb-3 flex items-center gap-2">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Lucide icon="FileText" class="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.description') }}</h2>
        </div>
        <p class="text-sm leading-7 text-slate-600 dark:text-slate-300">{{ info.description }}</p>
      </section>

      <!-- Main grid -->
      <div class="grid grid-cols-12 gap-5">
        <!-- Left column -->
        <div class="col-span-12 space-y-5 lg:col-span-8">
          <!-- Formula -->
          <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-3 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="Sigma" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.col-formula') }}</h2>
            </div>
            <pre
              dir="ltr"
              class="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/80 p-4 font-mono text-sm text-slate-600 dark:border-darkmode-700 dark:bg-darkmode-900/50 dark:text-slate-300"
            >{{ info.formula }}</pre>
          </section>

          <!-- Thresholds -->
          <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-4 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="AlertTriangle" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.thresholds') }}</h2>
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div class="group rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 transition-colors hover:border-emerald-300/60 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                <div class="flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-500/20">
                    <Lucide icon="CheckCircle2" class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </span>
                  <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{{ t('capital-metrics-page.target') }}</span>
                </div>
                <div class="mt-2.5 text-base font-bold text-slate-800 dark:text-slate-100">{{ info.annualTarget }}</div>
              </div>
              <div class="group rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 transition-colors hover:border-amber-300/60 dark:border-amber-500/20 dark:bg-amber-500/5">
                <div class="flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-500/20">
                    <Lucide icon="AlertCircle" class="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </span>
                  <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">{{ t('capital-metrics-page.warning') }}</span>
                </div>
                <div class="mt-2.5 text-base font-bold text-slate-800 dark:text-slate-100">{{ info.warningThreshold }}</div>
              </div>
              <div class="group rounded-xl border border-red-200/60 bg-red-50/50 p-4 transition-colors hover:border-red-300/60 dark:border-red-500/20 dark:bg-red-500/5">
                <div class="flex items-center gap-2">
                  <span class="flex h-6 w-6 items-center justify-center rounded-md bg-red-100 dark:bg-red-500/20">
                    <Lucide icon="XCircle" class="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  </span>
                  <span class="text-xs font-semibold text-red-600 dark:text-red-400">{{ t('capital-metrics-page.critical') }}</span>
                </div>
                <div class="mt-2.5 text-base font-bold text-slate-800 dark:text-slate-100">{{ info.criticalThreshold }}</div>
              </div>
            </div>
          </section>

          <!-- Framework mappings -->
          <section
            v-if="info.frameworkMappings && info.frameworkMappings.length > 0"
            class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <div class="mb-4 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="Layers" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.framework-mappings') }}</h2>
            </div>
            <div class="space-y-2.5">
              <div
                v-for="(m, i) in info.frameworkMappings"
                :key="i"
                class="flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 transition-colors hover:border-slate-200 dark:border-darkmode-700 dark:hover:border-darkmode-600"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Lucide icon="Link" class="h-4 w-4" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{{ m.frameworkName }}</span>
                    <span class="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-darkmode-700 dark:text-slate-300">{{ m.mappedControlId }}</span>
                  </div>
                  <div v-if="m.mappedTitle" class="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{{ m.mappedTitle }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Cascading effects -->
          <section
            v-if="info.cascadingEffectsAndRisks && info.cascadingEffectsAndRisks.length > 0"
            class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <div class="mb-4 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="GitBranch" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.cascading-effects') }}</h2>
            </div>
            <div class="space-y-3">
              <div
                v-for="(e, i) in info.cascadingEffectsAndRisks"
                :key="i"
                class="rounded-xl border border-slate-100 p-4 dark:border-darkmode-700"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span class="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                    <Lucide icon="ArrowRightLeft" class="h-3 w-3" />
                    {{ e.relationshipType }}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                    <Lucide icon="Zap" class="h-3 w-3" />
                    {{ e.effectDirection }}
                  </span>
                  <span class="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500 dark:bg-darkmode-700 dark:text-slate-400">
                    <Lucide icon="ArrowRight" class="h-3 w-3" />
                    {{ e.targetMetricId }}
                  </span>
                </div>
                <p class="mt-2.5 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ e.description }}</p>
              </div>
            </div>
          </section>

          <!-- Sustainability goal -->
          <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-3 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                <Lucide icon="Leaf" class="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.sustainability-goal') }}</h2>
            </div>
            <p class="text-sm leading-7 text-slate-600 dark:text-slate-300">{{ info.sustainabilityGoal }}</p>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="col-span-12 space-y-5 lg:col-span-4">
          <!-- Classification -->
          <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-4 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="Tag" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.classification') }}</h2>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.metric-role') }}</span>
                <span class="rounded-lg bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">{{ info.metricRole }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.metric-type') }}</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.metricType }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.data-type') }}</span>
                <span class="rounded-lg bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-darkmode-700 dark:text-slate-300">{{ info.dataType }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.calculation-type') }}</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.calculationType }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.resilience-test') }}</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.adaptiveResilienceTestType }}</span>
              </div>
            </div>
          </section>

          <!-- Data ownership -->
          <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-4 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="User" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.data-ownership') }}</h2>
            </div>
            <div class="space-y-3">
              <div class="flex items-start justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.data-owner') }}</span>
                <span class="text-end text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.dataOwner }}</span>
              </div>
              <div class="flex items-start justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.data-source') }}</span>
                <span class="text-end text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.dataSource }}</span>
              </div>
              <div class="flex items-start justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.source-asset') }}</span>
                <span class="text-end text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.sourceAssetType }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.has-sub-assets') }}</span>
                <span
                  class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold"
                  :class="info.hasSubAssets ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-darkmode-700 dark:text-slate-400'"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="info.hasSubAssets ? 'bg-emerald-500' : 'bg-slate-400'" />
                  {{ info.hasSubAssets ? t('general.yes') : t('general.no') }}
                </span>
              </div>
            </div>
          </section>

          <!-- Reporting -->
          <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-4 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="Clock" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.reporting') }}</h2>
            </div>
            <div class="space-y-3">
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.reporting-period') }}</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.reportingPeriod }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.collection-frequency') }}</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.collectionFrequency }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.spatial-aggregation') }}</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.spatialAggregation }}</span>
              </div>
              <div class="flex items-center justify-between rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.temporal-aggregation') }}</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.temporalAggregation }}</span>
              </div>
              <div class="flex items-start justify-between gap-3 rounded-lg bg-slate-50/80 px-3 py-2.5 dark:bg-darkmode-900/50">
                <span class="text-xs text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.dynamic-aggregation') }}</span>
                <span class="text-end text-xs font-semibold text-slate-700 dark:text-slate-200">{{ info.dynamicAggregationRule }}</span>
              </div>
            </div>
          </section>

          <!-- Industries -->
          <section class="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800">
            <div class="mb-3 flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Lucide icon="Factory" class="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ t('capital-metrics-page.col-industries') }}</h2>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="industry in info.industries"
                :key="industry"
                class="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary"
              >
                {{ industry }}
              </span>
            </div>

            <template v-if="info.associatedIndustries && info.associatedIndustries.length > 0">
              <div class="my-3 h-px bg-slate-100 dark:bg-darkmode-700" />
              <h3 class="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {{ t('capital-metrics-page.associated-industries') }}
              </h3>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="ind in info.associatedIndustries"
                  :key="ind"
                  class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-darkmode-700 dark:text-slate-300"
                >
                  {{ ind }}
                </span>
              </div>
            </template>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>
