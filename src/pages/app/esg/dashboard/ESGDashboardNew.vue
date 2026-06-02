<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ESGSectionData } from '@/types/esg-dashboard.interface';

interface Props {
  section: 'governance' | 'social' | 'environmental';
  dashboardData: {
    governance?: ESGSectionData;
    social?: ESGSectionData;
    environmental?: ESGSectionData;
    reporting_period?: string;
    last_updated?: string;
  };
}

const props = withDefaults(defineProps<Props>(), {
  section: 'governance',
});

const { t } = useI18n();
const sortBy = ref<'value' | 'domain' | 'status'>('value');
const isCollapsed = shallowRef(false);

const sectionData = computed(() => props.dashboardData[props.section]);

const sortedKpis = computed(() => {
  if (!sectionData.value?.all_kpis) return [];
  const kpis = [...sectionData.value.all_kpis];

  switch (sortBy.value) {
    case 'domain':
      return kpis.sort((a, b) => (a.domain || '').localeCompare(b.domain || '', 'fa'));
    case 'status':
      return kpis.sort((a, b) => a.status.localeCompare(b.status));
    default:
      return kpis.sort((a, b) => {
        const aVal = typeof a.value === 'number' ? a.value : 0;
        const bVal = typeof b.value === 'number' ? b.value : 0;
        return bVal - aVal;
      });
  }
});

const percentageKpis = computed(() => {
  if (!sectionData.value?.all_kpis) return [];
  return sectionData.value.all_kpis.filter((k) => k.unit === 'percent');
});

const domainAvgScores = computed(() => {
  if (!sectionData.value?.domains) return [];
  return sectionData.value.domains.map((d) => ({
    name: d.title,
    value: d.avg_score,
  }));
});

const answerCounts = computed(() => {
  const s = sectionData.value?.summary;
  if (!s) return { answered: 0, unanswered: 0 };
  return { answered: s.answered, unanswered: s.unanswered };
});

const typeDistribution = computed(() => {
  if (!sectionData.value?.all_kpis) return {};
  const dist: Record<string, number> = {};
  sectionData.value.all_kpis.forEach((kpi) => {
    const unit = kpi.unit || 'unknown';
    dist[unit] = (dist[unit] || 0) + 1;
  });
  return dist;
});

const getScoreColor = (value: number | string) => {
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return 'bg-gray-100 text-gray-700';
  if (num >= 80) return 'bg-green-100 text-green-700';
  if (num >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const getStatusBadge = (status: string) => {
  return status === 'answered' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200';
};
</script>

<template>
  <div v-if="sectionData" dir="rtl" class="space-y-5 pb-8">
    <!-- Header -->
    <div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-xl font-semibold text-slate-900 dark:text-white">
          {{ t(`esg.section.${section}`) }} داشبورد ESG
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {{ sectionData.summary.total_kpis }} شاخص کلیدی · {{ sectionData.domains.length }} دامنه ·
          <span v-if="dashboardData.last_updated" class="inline">آخرین‌بروزرسانی {{ dashboardData.last_updated }}</span>
        </p>
      </div>
      <div class="inline-block rounded-lg bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
        دوره گزارش: {{ dashboardData.reporting_period || '۲۰۲۴' }}
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <!-- Total KPIs -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400">مجموع شاخص‌های کلیدی</p>
        <p class="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{{ sectionData.summary.total_kpis }}</p>
        <span class="mt-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          {{ sectionData.domains.length }} دامنه
        </span>
      </div>

      <!-- Answered -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400">شاخص‌های پاسخ‌داده‌شده</p>
        <p class="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{{ sectionData.summary.answered }}</p>
        <span class="mt-2 inline-block rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
          {{ sectionData.summary.completion.toFixed(1) }}% کامل
        </span>
      </div>

      <!-- Unanswered -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400">بدون‌پاسخ</p>
        <p class="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{{ sectionData.summary.unanswered }}</p>
        <span v-if="sectionData.summary.unanswered > 0" class="mt-2 inline-block rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
          نیاز به توجه
        </span>
        <span v-else class="mt-2 inline-block rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
          کامل
        </span>
      </div>

      <!-- Avg Score -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400">میانگین امتیاز</p>
        <p class="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{{ sectionData.summary.avg_score.toFixed(1) }}</p>
        <span class="mt-2 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          % از ارزیابی
        </span>
      </div>

      <!-- Completion Rate -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400">نرخ تکمیل</p>
        <div class="mt-2 flex items-center gap-2">
          <div class="flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div class="h-2 bg-green-500" :style="{ width: `${sectionData.summary.completion}%` }" />
          </div>
          <span class="text-lg font-bold text-slate-900 dark:text-white">{{ sectionData.summary.completion.toFixed(0) }}%</span>
        </div>
      </div>
    </div>

    <!-- Heatmap Section -->
    <div class="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <i class="ti ti-layout-grid text-slate-500" />
        نقشه‌حرارتی شاخص‌های کلیدی کامل
      </h2>
      <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
        رنگ‌بندی: سبز ≥ 80٪، عنبری 50-79٪، قرمز &lt; 50٪، خاکستری برای شمار/ارز
      </p>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th class="p-2 text-right font-medium text-slate-600 dark:text-slate-300">کد شاخص</th>
              <th class="p-2 text-right font-medium text-slate-600 dark:text-slate-300">عنوان</th>
              <th class="min-w-12 p-2 text-center font-medium text-slate-600 dark:text-slate-300">مقدار</th>
              <th class="min-w-12 p-2 text-center font-medium text-slate-600 dark:text-slate-300">واحد</th>
              <th class="min-w-12 p-2 text-center font-medium text-slate-600 dark:text-slate-300">دامنه</th>
              <th class="min-w-12 p-2 text-center font-medium text-slate-600 dark:text-slate-300">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kpi in sectionData.all_kpis" :key="kpi.code" class="border-b border-slate-100 dark:border-slate-700">
              <td class="p-2 font-mono text-slate-700 dark:text-slate-300">{{ kpi.code }}</td>
              <td class="p-2 text-slate-700 dark:text-slate-300" :title="kpi.title">
                {{ kpi.title.substring(0, 40) }}{{ kpi.title.length > 40 ? '...' : '' }}
              </td>
              <td :class="`p-2 text-center font-semibold rounded ${getScoreColor(kpi.value)}`">
                {{ kpi.value }}
              </td>
              <td class="p-2 text-center text-slate-600 dark:text-slate-400">{{ kpi.unit }}</td>
              <td class="p-2 text-center text-slate-600 dark:text-slate-400">{{ kpi.domain || '-' }}</td>
              <td class="p-2 text-center">
                <span :class="`inline-block rounded px-2 py-1 text-xs font-medium border ${getStatusBadge(kpi.status)}`">
                  {{ kpi.status === 'answered' ? '✓ پاسخ‌داده' : '✗ بدون‌پاسخ' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid gap-5 lg:grid-cols-2">
      <!-- Domains Radar Chart -->
      <div class="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <i class="ti ti-radar text-slate-500" />
          میانگین امتیاز دامنه‌ها
        </h3>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">میانگین امتیازات درصدی برای هر دامنه</p>

        <div class="mt-4 space-y-2">
          <div v-for="domain in sectionData.domains" :key="domain.code" class="flex items-center gap-3">
            <span class="w-24 truncate text-xs font-medium text-slate-700 dark:text-slate-300" :title="domain.title">
              {{ domain.title.substring(0, 15) }}
            </span>
            <div class="flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
              <div class="h-2 rounded-full transition-all" :class="domain.avg_score >= 80 ? 'bg-green-500' : domain.avg_score >= 50 ? 'bg-amber-500' : 'bg-red-500'" :style="{ width: `${Math.min(domain.avg_score, 100)}%` }" />
            </div>
            <span class="w-10 text-right text-xs font-bold text-slate-900 dark:text-white">{{ domain.avg_score.toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <!-- Answer Status Donut -->
      <div class="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <i class="ti ti-chart-pie text-slate-500" />
          وضعیت پاسخ‌ها
        </h3>
        <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">نسبت شاخص‌های پاسخ‌داده‌شده و بدون‌پاسخ</p>

        <div class="mt-6 flex items-center justify-center">
          <div class="relative h-32 w-32">
            <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90 transform">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="8" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#1d9e75"
                stroke-width="8"
                stroke-dasharray="251.2"
                stroke-dashoffset="0"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-lg font-bold text-slate-900 dark:text-white">{{ ((answerCounts.answered / sectionData.summary.total_kpis) * 100).toFixed(0) }}%</span>
              <span class="text-xs text-slate-600 dark:text-slate-400">کامل</span>
            </div>
          </div>
        </div>

        <div class="mt-6 space-y-2 text-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="block h-3 w-3 rounded bg-green-500" />
              <span class="text-slate-700 dark:text-slate-300">پاسخ‌داده‌شده</span>
            </div>
            <span class="font-bold text-slate-900 dark:text-white">{{ answerCounts.answered }}</span>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="block h-3 w-3 rounded bg-red-500" />
              <span class="text-slate-700 dark:text-slate-300">بدون‌پاسخ</span>
            </div>
            <span class="font-bold text-slate-900 dark:text-white">{{ answerCounts.unanswered }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Domain Detail Cards -->
    <div v-if="sectionData.domains.length > 0" class="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <i class="ti ti-cards text-slate-500" />
        جزئیات دامنه‌ها
      </h3>

      <div class="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="domain in sectionData.domains" :key="domain.code" class="rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-700/50">
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-semibold text-slate-900 dark:text-white">{{ domain.title }}</h4>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">{{ domain.code }}</p>
            </div>
            <span :class="`inline-block rounded-full px-2 py-1 text-xs font-bold ${domain.avg_score >= 80 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : domain.avg_score >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`">
              {{ domain.avg_score.toFixed(0) }}%
            </span>
          </div>

          <div class="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-600">
            <div class="flex justify-between text-xs">
              <span class="text-slate-600 dark:text-slate-400">شاخص‌های کلیدی</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ domain.kpi_count }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-600 dark:text-slate-400">پاسخ‌داده</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ domain.answered }} / {{ domain.kpi_count }}</span>
            </div>
            <div class="mt-2 overflow-hidden rounded bg-gray-200 dark:bg-slate-600">
              <div class="h-1.5 bg-green-500" :style="{ width: `${(domain.answered / domain.kpi_count) * 100}%` }" />
            </div>
          </div>

          <div v-if="domain.kpis && domain.kpis.length > 0" class="mt-3 border-t border-slate-200 pt-3 dark:border-slate-600">
            <p class="mb-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              {{ Math.min(3, domain.kpis.length) }} از {{ domain.kpis.length }} شاخص
            </p>
            <div class="space-y-1 text-xs">
              <div v-for="kpi in domain.kpis.slice(0, 3)" :key="kpi.code" class="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                <span class="flex-shrink-0">•</span>
                <span class="truncate">{{ kpi.title.substring(0, 30) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table Section -->
    <div class="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <i class="ti ti-table text-slate-500" />
          تمام شاخص‌های کلیدی
        </h3>
        <div class="flex items-center gap-2">
          <label class="text-xs text-slate-600 dark:text-slate-400">مرتب‌سازی:</label>
          <select v-model="sortBy" class="rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-700 dark:text-white">
            <option value="value">بر اساس مقدار</option>
            <option value="domain">بر اساس دامنه</option>
            <option value="status">بر اساس وضعیت</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700">
              <th class="p-2 text-right font-medium text-slate-600 dark:text-slate-300">کد</th>
              <th class="p-2 text-right font-medium text-slate-600 dark:text-slate-300">عنوان</th>
              <th class="p-2 text-center font-medium text-slate-600 dark:text-slate-300">مقدار</th>
              <th class="p-2 text-center font-medium text-slate-600 dark:text-slate-300">واحد</th>
              <th class="p-2 text-center font-medium text-slate-600 dark:text-slate-300">دامنه</th>
              <th class="p-2 text-center font-medium text-slate-600 dark:text-slate-300">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kpi in sortedKpis" :key="kpi.code" class="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30">
              <td class="p-2 font-mono text-slate-700 dark:text-slate-300">{{ kpi.code }}</td>
              <td class="p-2 text-slate-700 dark:text-slate-300" :title="kpi.title">
                {{ kpi.title.substring(0, 50) }}{{ kpi.title.length > 50 ? '...' : '' }}
              </td>
              <td :class="`p-2 text-center font-semibold rounded ${getScoreColor(kpi.value)}`">
                {{ kpi.value }}
              </td>
              <td class="p-2 text-center text-slate-600 dark:text-slate-400">{{ kpi.unit }}</td>
              <td class="p-2 text-center text-slate-600 dark:text-slate-400">{{ kpi.domain || '-' }}</td>
              <td class="p-2 text-center">
                <span :class="`inline-block rounded px-2 py-1 text-xs font-medium border ${getStatusBadge(kpi.status)}`">
                  {{ kpi.status === 'answered' ? '✓' : '✗' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ti) {
  display: inline-block;
}
</style>
