<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { grcRepo } from '@/core/repositories/grcRepo';
import Button from '@/base-components/Button';
import Lucide from '@/base-components/Lucide';

interface FrameworkMapping {
  mapped_title: string;
  framework_name: string;
  mapped_control_id: string;
}

interface CascadingEffect {
  description: string;
  effect_direction: string;
  target_metric_id: string;
  relationship_type: string;
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

interface DirectionBadge {
  icon: string;
  cls: string;
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

function directionBadge(dir?: string): DirectionBadge {
  if (dir === 'maximize') return { icon: 'TrendingUp', cls: 'bg-success/10 text-success' };
  if (dir === 'minimize') return { icon: 'TrendingDown', cls: 'bg-danger/10 text-danger' };
  return { icon: 'Minus', cls: 'bg-slate-100 text-slate-600 dark:bg-darkmode-700 dark:text-slate-300' };
}

function roleBadge(role?: string): string {
  const map: Record<string, string> = {
    CONTROL: 'bg-info/10 text-info',
    OUTCOME: 'bg-primary/10 text-primary',
    DRIVER: 'bg-warning/10 text-warning',
  };
  return map[role ?? ''] ?? 'bg-slate-100 text-slate-600 dark:bg-darkmode-700 dark:text-slate-300';
}

onMounted(() => {
  void fetchMetric();
});
</script>

<template>
  <div class="p-4">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>

    <!-- Empty -->
    <div v-else-if="!info" class="py-24 text-center text-sm text-slate-400">
      {{ t('general.no-data') }}
    </div>

    <!-- Content -->
    <div v-else class="space-y-4">
      <!-- Hero header -->
      <div
          class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-gradient-to-br from-primary to-primary-muted p-6 text-white shadow-sm dark:border-darkmode-700/60"
      >
        <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div class="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/5" />

        <div class="relative flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur">
                {{ info.number }}
              </span>
              <span class="rounded-md bg-white/15 px-2 py-0.5 text-xs">v{{ info.version }}</span>
              <span
                  class="rounded-md px-2 py-0.5 text-xs font-medium"
                  :class="info.isActive ? 'bg-success/30 text-white' : 'bg-danger/30 text-white'"
              >
                {{ info.isActive ? t('general.active') : t('general.inactive') }}
              </span>
              <span class="rounded-md bg-white/15 px-2 py-0.5 text-xs">{{ info.metricType }}</span>
            </div>
            <h1 class="mt-3 text-xl font-semibold leading-snug">{{ info.title }}</h1>
            <p class="mt-2 text-sm text-white/80">
              {{ info.categoryTitle }} <span class="mx-1 opacity-50">/</span> {{ info.categorySubTitle }}
            </p>
          </div>

          <Button
              type="button"
              variant="outline-secondary"
              size="sm"
              class="bg-white/95 text-primary hover:bg-white"
              @click="goBack"
          >
            <Lucide icon="ArrowRight" class="h-4 w-4 ltr:hidden" />
            <Lucide icon="ArrowLeft" class="h-4 w-4 rtl:hidden" />
            {{ t('general.back') }}
          </Button>
        </div>

        <!-- KPI strip -->
        <div class="relative mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="rounded-xl bg-white/15 p-3 backdrop-blur">
            <div class="text-[11px] uppercase tracking-wide text-white/70">
              {{ t('capital-metrics-page.col-unit') }}
            </div>
            <div class="mt-1 text-base font-semibold">{{ info.unit }}</div>
          </div>
          <div class="rounded-xl bg-white/15 p-3 backdrop-blur">
            <div class="text-[11px] uppercase tracking-wide text-white/70">
              {{ t('capital-metrics-page.annual-target') }}
            </div>
            <div class="mt-1 text-base font-semibold">{{ info.annualTarget }}</div>
          </div>
          <div class="rounded-xl bg-white/15 p-3 backdrop-blur">
            <div class="text-[11px] uppercase tracking-wide text-white/70">
              {{ t('capital-metrics-page.target-year') }}
            </div>
            <div class="mt-1 text-base font-semibold">{{ info.targetYear }}</div>
          </div>
          <div class="rounded-xl bg-white/15 p-3 backdrop-blur">
            <div class="text-[11px] uppercase tracking-wide text-white/70">
              {{ t('capital-metrics-page.col-direction') }}
            </div>
            <div class="mt-1 flex items-center gap-1 text-base font-semibold">
              <Lucide :icon="(directionBadge(info.direction).icon as any)" class="h-4 w-4" />
              {{ info.direction }}
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      <section
          class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
      >
        <div class="mb-3 flex items-center gap-2">
          <Lucide icon="FileText" class="h-4 w-4 text-primary" />
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {{ t('capital-metrics-page.description') }}
          </h2>
        </div>
        <p class="text-sm leading-7 text-slate-600 dark:text-slate-300">{{ info.description }}</p>
      </section>

      <!-- Main grid -->
      <div class="grid grid-cols-12 gap-4">
        <!-- Left column -->
        <div class="col-span-12 space-y-4 lg:col-span-8">
          <!-- Formula -->
          <section
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <div class="mb-3 flex items-center gap-2">
              <Lucide icon="Sigma" class="h-4 w-4 text-primary" />
              <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('capital-metrics-page.col-formula') }}
              </h2>
            </div>
            <pre
                dir="ltr"
                class="overflow-x-auto rounded-lg bg-slate-50 p-4 text-sm font-mono text-slate-700 dark:bg-darkmode-900 dark:text-slate-200"
            >{{ info.formula }}</pre>
          </section>

          <!-- Thresholds -->
          <section
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <div class="mb-4 flex items-center gap-2">
              <Lucide icon="AlertTriangle" class="h-4 w-4 text-primary" />
              <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('capital-metrics-page.thresholds') }}
              </h2>
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div class="rounded-xl border border-success/20 bg-success/5 p-4">
                <div class="text-xs font-medium text-success">{{ t('capital-metrics-page.target') }}</div>
                <div class="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {{ info.annualTarget }}
                </div>
              </div>
              <div class="rounded-xl border border-warning/20 bg-warning/5 p-4">
                <div class="text-xs font-medium text-warning">{{ t('capital-metrics-page.warning') }}</div>
                <div class="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {{ info.warningThreshold }}
                </div>
              </div>
              <div class="rounded-xl border border-danger/20 bg-danger/5 p-4">
                <div class="text-xs font-medium text-danger">{{ t('capital-metrics-page.critical') }}</div>
                <div class="mt-1 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {{ info.criticalThreshold }}
                </div>
              </div>
            </div>
          </section>

          <!-- Framework mappings -->
          <section
              v-if="info.frameworkMappings && info.frameworkMappings.length > 0"
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <div class="mb-4 flex items-center gap-2">
              <Lucide icon="Layers" class="h-4 w-4 text-primary" />
              <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('capital-metrics-page.framework-mappings') }}
              </h2>
            </div>
            <div class="space-y-2">
              <div
                  v-for="(m, i) in info.frameworkMappings"
                  :key="i"
                  class="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-slate-200/60 p-3 dark:border-darkmode-700/60"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      {{ m.framework_name }}
                    </span>
                    <span
                        class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-darkmode-700 dark:text-slate-300"
                    >
                      {{ m.mapped_control_id }}
                    </span>
                  </div>
                  <div class="mt-1 text-sm text-slate-700 dark:text-slate-200">{{ m.mapped_title }}</div>
                </div>
              </div>
            </div>
          </section>

          <!-- Cascading effects -->
          <section
              v-if="info.cascadingEffectsAndRisks && info.cascadingEffectsAndRisks.length > 0"
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <div class="mb-4 flex items-center gap-2">
              <Lucide icon="GitBranch" class="h-4 w-4 text-primary" />
              <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('capital-metrics-page.cascading-effects') }}
              </h2>
            </div>
            <div class="space-y-3">
              <div
                  v-for="(e, i) in info.cascadingEffectsAndRisks"
                  :key="i"
                  class="rounded-xl border border-slate-200/60 p-4 dark:border-darkmode-700/60"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                    {{ e.relationship_type }}
                  </span>
                  <span class="rounded bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                    {{ e.effect_direction }}
                  </span>
                  <span class="text-xs text-slate-500 dark:text-slate-400">→ {{ e.target_metric_id }}</span>
                </div>
                <p class="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{{ e.description }}</p>
              </div>
            </div>
          </section>

          <!-- Sustainability goal -->
          <section
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <div class="mb-3 flex items-center gap-2">
              <Lucide icon="Target" class="h-4 w-4 text-primary" />
              <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {{ t('capital-metrics-page.sustainability-goal') }}
              </h2>
            </div>
            <p class="text-sm leading-7 text-slate-600 dark:text-slate-300">{{ info.sustainabilityGoal }}</p>
          </section>
        </div>

        <!-- Sidebar -->
        <aside class="col-span-12 space-y-4 lg:col-span-4">
          <!-- Classification -->
          <section
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ t('capital-metrics-page.classification') }}
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.metric-role') }}</dt>
                <dd>
                  <span class="rounded px-2 py-0.5 text-xs font-medium" :class="roleBadge(info.metricRole)">
                    {{ info.metricRole }}
                  </span>
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.metric-type') }}</dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">{{ info.metricType }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.data-type') }}</dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">{{ info.dataType }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.calculation-type') }}
                </dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">{{ info.calculationType }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.resilience-test') }}
                </dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">
                  {{ info.adaptiveResilienceTestType }}
                </dd>
              </div>
            </dl>
          </section>

          <!-- Data ownership -->
          <section
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ t('capital-metrics-page.data-ownership') }}
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex items-start justify-between gap-2">
                <dt class="text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.data-owner') }}</dt>
                <dd class="text-end font-medium text-slate-700 dark:text-slate-200">{{ info.dataOwner }}</dd>
              </div>
              <div class="flex items-start justify-between gap-2">
                <dt class="text-slate-500 dark:text-slate-400">{{ t('capital-metrics-page.data-source') }}</dt>
                <dd class="text-end font-medium text-slate-700 dark:text-slate-200">{{ info.dataSource }}</dd>
              </div>
              <div class="flex items-start justify-between gap-2">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.source-asset') }}
                </dt>
                <dd class="text-end font-medium text-slate-700 dark:text-slate-200">
                  {{ info.sourceAssetType }}
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.has-sub-assets') }}
                </dt>
                <dd>
                  <span
                      class="rounded px-2 py-0.5 text-xs font-medium"
                      :class="
                      info.hasSubAssets
                        ? 'bg-success/10 text-success'
                        : 'bg-slate-100 text-slate-600 dark:bg-darkmode-700 dark:text-slate-300'
                    "
                  >
                    {{ info.hasSubAssets ? t('general.yes') : t('general.no') }}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <!-- Reporting -->
          <section
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <h2 class="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ t('capital-metrics-page.reporting') }}
            </h2>
            <dl class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.reporting-period') }}
                </dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">{{ info.reportingPeriod }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.collection-frequency') }}
                </dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">{{ info.collectionFrequency }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.spatial-aggregation') }}
                </dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">{{ info.spatialAggregation }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.temporal-aggregation') }}
                </dt>
                <dd class="font-medium text-slate-700 dark:text-slate-200">{{ info.temporalAggregation }}</dd>
              </div>
              <div class="flex items-start justify-between gap-2">
                <dt class="text-slate-500 dark:text-slate-400">
                  {{ t('capital-metrics-page.dynamic-aggregation') }}
                </dt>
                <dd class="text-end font-medium text-slate-700 dark:text-slate-200">
                  {{ info.dynamicAggregationRule }}
                </dd>
              </div>
            </dl>
          </section>

          <!-- Industries -->
          <section
              class="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm dark:border-darkmode-700/60 dark:bg-darkmode-800"
          >
            <h2 class="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {{ t('capital-metrics-page.col-industries') }}
            </h2>
            <div class="flex flex-wrap gap-2">
              <span
                  v-for="industry in info.industries"
                  :key="industry"
                  class="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
              >
                {{ industry }}
              </span>
            </div>

            <template v-if="info.associatedIndustries && info.associatedIndustries.length > 0">
              <h3 class="mb-2 mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {{ t('capital-metrics-page.associated-industries') }}
              </h3>
              <div class="flex flex-wrap gap-2">
                <span
                    v-for="ind in info.associatedIndustries"
                    :key="ind"
                    class="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-darkmode-700 dark:text-slate-300"
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
