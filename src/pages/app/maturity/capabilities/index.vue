<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import PeriodSelectPanel from '@/components/PeriodSelectPanel.vue';
import Lucide from '@/base-components/Lucide';
import { maturityRepo } from '@/core/repositories/maturityRepo';
import { toFa } from '@/components/dashboard/helpers';
import { levelColor, levelLabelKey } from '../levels';
import { IconTrendingUp } from '@tabler/icons-vue';

const { t } = useI18n();
const router = useRouter();

const period = ref<{ type: string; startDate: string; endDate: string } | null>(null);
const levelFilter = ref(0); // 0 = all

const fetchCapabilities: FetchFn = async ({ page, limit }) => {
  const res = await maturityRepo.list({
    page,
    limit,
    period_type: period.value?.type ?? 'YEARLY',
    date_from: period.value?.startDate ?? undefined,
    date_to: period.value?.endDate ?? undefined,
    maturityLevel: levelFilter.value ? [levelFilter.value] : undefined,
  });
  const list = res?.data?.list ?? [];
  return {
    list: Array.isArray(list) ? list : [],
    count: res?.data?.paginator?.count ?? 0,
  };
};

const table = useDataTable({
  fetchFn: fetchCapabilities,
  columns: [
    createColumn({
      key: 'capabilityTitle',
      label: t('maturity.col-capability'),
      bodyCell: (row) => String(row.capabilityTitle ?? row.capabilitySlug ?? '—'),
    }),
    createColumn({
      key: 'capitalTitle',
      label: t('maturity.col-capital'),
      bodyCell: (row) => String(row.capitalTitle ?? '—'),
    }),
    createColumn({
      key: 'domainTitle',
      label: t('maturity.col-domain'),
      bodyCell: (row) => String(row.domainTitle ?? '—'),
    }),
    createColumn({
      key: 'score',
      label: t('maturity.col-score'),
      align: 'center' as const,
      bodyCell: (row) => `${toFa(Number(row.score ?? 0))}٪`,
    }),
    createColumn({
      key: 'maturityLevel',
      label: t('maturity.col-level'),
      align: 'center' as const,
      bodyCell: (row) => `L${toFa(Number(row.maturityLevel ?? 0))}`,
    }),
    createColumn({
      key: 'requiredMaturity',
      label: t('maturity.col-required'),
      align: 'center' as const,
      bodyCell: (row) => (row.requiredMaturity == null ? '—' : `L${toFa(Number(row.requiredMaturity))}`),
    }),
    createColumn({
      key: 'gap',
      label: t('maturity.col-gap'),
      align: 'center' as const,
      bodyCell: (row) => (row.gap == null ? '—' : toFa(Number(row.gap))),
    }),
    createColumn({
      key: 'trend',
      label: t('maturity.col-trend'),
      align: 'center' as const,
      bodyCell: (row) => String(row.trend ?? '—'),
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'maturity-capabilities-list',
  listCacheStaleTime: 0,
});

watch([period, levelFilter], () => {
  table.invalidateListCache();
  table.setPage(1);
  table.fetch();
});

function onRowClick(row: Record<string, unknown>) {
  const slug = row.capabilitySlug ?? row.slug;
  if (!slug) return;
  router.push({ name: 'app-maturity-capability-detail', params: { slug: String(slug) } });
}

function onExport() {
  table.exportCSV();
}

const levelOptions = computed(() => [0, 1, 2, 3, 4, 5]);

onMounted(() => {
  table.invalidateListCache();
  table.fetch();
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <!-- Header -->
      <header class="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-muted text-primary">
            <IconTrendingUp :size="24" />
          </span>
          <div>
            <h1 class="text-lg font-extrabold text-slate-900">{{ t('maturity.list-title') }}</h1>
            <p class="mt-0.5 text-xs text-slate-500">{{ t('maturity.list-subtitle') }}</p>
          </div>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
          @click="onExport"
        >
          <Lucide icon="Download" class="h-4 w-4" />
          {{ t('general.download') }}
        </button>
      </header>

      <!-- Filters -->
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="w-56 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
          <PeriodSelectPanel
            v-model="period"
            :placeholder="t('maturity.period')"
            :label="period ? `${t('reports.period-type.yearly')} · ${toFa(period.startDate.slice(0, 4))}` : ''"
            :types="['YEARLY']"
          />
        </div>
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <label class="text-xs font-medium text-slate-500">{{ t('maturity.filter-level') }}</label>
          <select
            v-model="levelFilter"
            class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option :value="0">{{ t('maturity.filter-all') }}</option>
            <option v-for="l in [1, 2, 3, 4, 5]" :key="l" :value="l">
              L{{ toFa(l) }} — {{ t(levelLabelKey(l)) }}
            </option>
          </select>
        </div>
      </div>

      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="false"
        :show-search="false"
        @row-click="onRowClick"
      >
        <template #cell-score="{ row }">
          <span class="font-bold text-slate-800">{{ toFa(Number(row.score ?? 0)) }}٪</span>
        </template>
        <template #cell-maturityLevel="{ row }">
          <span
            class="inline-flex min-w-[2.25rem] items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold text-white"
            :style="{ backgroundColor: levelColor(Number(row.maturityLevel ?? 0)) }"
          >
            L{{ toFa(Number(row.maturityLevel ?? 0)) }}
          </span>
        </template>
        <template #cell-requiredMaturity="{ row }">
          <span class="text-slate-500">{{ row.requiredMaturity == null ? '—' : `L${toFa(Number(row.requiredMaturity))}` }}</span>
        </template>
        <template #cell-gap="{ row }">
          <span
            v-if="Number(row.gap) > 0"
            class="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold"
            :style="{ backgroundColor: '#dc26261a', color: '#dc2626' }"
          >
            -{{ toFa(Number(row.gap)) }}
          </span>
          <span v-else class="text-slate-300">—</span>
        </template>
        <template #cell-trend="{ row }">
          <Lucide
            v-if="row.trend === 'up'"
            icon="TrendingUp"
            class="mx-auto h-4 w-4 text-success"
          />
          <Lucide
            v-else-if="row.trend === 'down'"
            icon="TrendingDown"
            class="mx-auto h-4 w-4 text-danger"
          />
          <span v-else class="mx-auto block h-1 w-4 rounded-full bg-slate-300"></span>
        </template>
      </BaseTable>
    </div>
  </div>
</template>
