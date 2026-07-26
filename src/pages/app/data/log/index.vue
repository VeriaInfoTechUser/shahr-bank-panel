<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDataTable, createColumn, type FetchFn } from '@core';
import BaseTable from '@core/ui/base/BaseTable.vue';
import BaseModal from '@/core/ui/base/BaseModal.vue';
import { grcRepo } from '@/core/repositories/grcRepo';
import Lucide from '@/base-components/Lucide';
import Button from '@/base-components/Button';

const { t } = useI18n();

/* ---------------------------------------------------------------------- */
/* Status helpers                                                          */
/* ---------------------------------------------------------------------- */
const STATUS_META: Record<number, { label: string; dot: string; badge: string }> = {
  1: {
    label: 'job-log.status-success',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  },
  0: {
    label: 'job-log.status-error',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
  },
};

function statusMeta(status: number) {
  return STATUS_META[status] ?? {
    label: 'job-log.status-unknown',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-darkmode-600 dark:text-slate-300 dark:border-darkmode-500',
  };
}

/* ---------------------------------------------------------------------- */
/* Table                                                                   */
/* ---------------------------------------------------------------------- */
const fetchLogs: FetchFn = async ({ page, limit, filters }) => {
  const res = await grcRepo.calculationLogList({ page, limit, ...(filters ?? {}) });
  const list = res?.data?.list ?? [];
  const count = res?.data?.paginator?.count ?? 0;
  return { list: Array.isArray(list) ? list : [], count };
};

const table = useDataTable({
  fetchFn: fetchLogs,
  columns: [
    createColumn({
      key: 'id',
      label: '#',
      sortable: false,
      bodyCell: (row) => row.id ?? '—',
    }),
    createColumn({
      key: 'indicator_slug',
      label: t('job-log.indicator-slug'),
      sortable: false,
      bodyCell: (row) => row.indicator_slug ?? '—',
    }),
    createColumn({
      key: 'indicator_name',
      label: t('job-log.indicator-name'),
      sortable: false,
      bodyCell: (row) => row.indicator_name ?? '—',
    }),
    createColumn({
      key: 'calculation_type',
      label: t('job-log.calculation-type'),
      sortable: false,
      slot: true,
    }),
    createColumn({
      key: 'status',
      label: t('job.status'),
      sortable: false,
      slot: true,
    }),
    createColumn({
      key: 'message',
      label: t('job-log.message'),
      sortable: false,
      bodyCell: (row) => {
        const msg = row.error_message ?? row.data_object?.message ?? row.data_object?.error ?? '';
        return String(msg).length > 80 ? String(msg).slice(0, 80) + '…' : (String(msg) || '—');
      },
    }),
    createColumn({
      key: 'created_at',
      label: t('job-log.created-at'),
      sortable: false,
      bodyCell: (row) => {
        const d = row.created_at ?? row.timestamp;
        if (!d) return '—';
        return new Date(d as string).toLocaleString('fa-IR');
      },
    }),
  ],
  selectable: false,
  exportEnabled: true,
  cacheKey: 'calculation-log-list',
  listCacheStaleTime: 0,
});

/* ---------------------------------------------------------------------- */
/* Detail modal                                                            */
/* ---------------------------------------------------------------------- */
const showDetail = ref(false);
const selectedLog = ref<Record<string, unknown> | null>(null);

function openDetail(row: Record<string, unknown>) {
  selectedLog.value = row;
  showDetail.value = true;
}

const copiedField = ref<string | null>(null);
async function copyValue(label: string, value: unknown) {
  if (value === undefined || value === null) return;
  try {
    await navigator.clipboard.writeText(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
    copiedField.value = label;
    setTimeout(() => { if (copiedField.value === label) copiedField.value = null; }, 1500);
  } catch { /* ignore */ }
}

function prettyJson(obj: unknown): string {
  if (obj === null || obj === undefined) return '—';
  if (typeof obj === 'string') return obj;
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

onMounted(() => {
  table.fetch();
});
</script>

<template>
  <div class="grid grid-cols-12 gap-2 p-2">
    <div class="col-span-12">
      <BaseTable
        :table="table"
        :selectable="false"
        :export-enabled="table.exportEnabled"
        :empty-message="t('general.no-data')"
        :actions="true"
        :show-search="false"
      >
        <template #cell-calculation_type="{ row }">
          {{ t(`job-log.type-${String(row.calculation_type ?? '').toLowerCase()}`) || row.calculation_type || '—' }}
        </template>

        <template #cell-status="{ row }">
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
            :class="statusMeta(Number(row.status ?? -1)).badge"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta(Number(row.status ?? -1)).dot" />
            {{ t(statusMeta(Number(row.status ?? -1)).label) }}
          </span>
        </template>

        <template #actions="{ row }">
          <div class="flex items-center justify-center">
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              class="!h-7 !px-2.5 !py-0"
              @click.stop="openDetail(row)"
            >
              {{ t('job-log.detail') }}
            </Button>
          </div>
        </template>
      </BaseTable>
    </div>

    <!-- ── Detail Modal ──────────────────────────────────────────── -->
    <BaseModal
      :visible="showDetail"
      :title="t('job-log.detail-title')"
      size="lg"
      :content-class="'p-0'"
      @update:visible="showDetail = $event"
    >
      <div v-if="selectedLog" class="max-h-[70vh] overflow-y-auto px-6 py-5">
        <!-- Header -->
        <div class="mb-5 flex items-start gap-4">
          <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Lucide icon="ScrollText" class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3">
              <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {{ t('job-log.log') }} #{{ selectedLog.id }}
              </h3>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="statusMeta(Number(selectedLog.status ?? -1)).badge"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta(Number(selectedLog.status ?? -1)).dot" />
                {{ t(statusMeta(Number(selectedLog.status ?? -1)).label) }}
              </span>
            </div>
            <p class="mt-1 font-mono text-xs text-slate-500 dark:text-slate-400">
              {{ selectedLog.slug }}
            </p>
          </div>
        </div>

        <!-- Fields grid -->
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div v-for="f in [
            { label: t('job-log.id'), value: selectedLog.id, mono: true },
            { label: t('job-log.job-id'), value: selectedLog.job_id, mono: true },
            { label: t('job-log.indicator-slug'), value: selectedLog.indicator_slug, mono: true },
            { label: t('job-log.calculation-type'), value: selectedLog.calculation_type },
            { label: t('job-log.tenant-id'), value: selectedLog.tenant_id ?? '—' },
            { label: t('job-log.timestamp'), value: selectedLog.timestamp ? new Date(String(selectedLog.timestamp)).toLocaleString('fa-IR') : '—' },
          ]" :key="f.label" class="group relative rounded-xl border border-slate-100 bg-white px-3.5 py-3 transition-all hover:border-slate-200 hover:shadow-sm dark:border-darkmode-600 dark:bg-darkmode-700 dark:hover:border-darkmode-500">
            <span class="text-[11px] font-medium text-slate-400 dark:text-slate-500">{{ f.label }}</span>
            <p class="mt-1 truncate text-xs font-medium text-slate-800 dark:text-slate-100" :class="{ 'font-mono': f.mono }">
              {{ f.value ?? '—' }}
            </p>
            <button
              v-if="f.value && f.value !== '—'"
              type="button"
              class="absolute end-2 top-2 rounded-md p-1 text-slate-300 opacity-0 shadow-sm transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
              @click="copyValue(String(f.label), f.value)"
            >
              <Lucide :icon="copiedField === String(f.label) ? 'Check' : 'Copy'" class="h-3 w-3" :class="copiedField === String(f.label) ? 'text-emerald-500' : ''" />
            </button>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="selectedLog.error_message" class="mt-4">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ t('job-log.error-message') }}</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
              @click="copyValue('error_message', selectedLog.error_message)"
            >
              <Lucide :icon="copiedField === 'error_message' ? 'Check' : 'Copy'" class="h-3 w-3" :class="copiedField === 'error_message' ? 'text-emerald-500' : ''" />
              {{ copiedField === 'error_message' ? t('documents.copied') : t('documents.copy') }}
            </button>
          </div>
          <div class="mt-2 rounded-xl border border-red-150 bg-red-50/80 p-3 dark:border-red-500/20 dark:bg-red-500/5">
            <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed text-red-700 dark:text-red-400">{{ selectedLog.error_message }}</pre>
          </div>
        </div>

        <!-- Data object -->
        <div class="mt-4">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ t('job-log.data-object') }}</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
              @click="copyValue('data_object', selectedLog.data_object)"
            >
              <Lucide :icon="copiedField === 'data_object' ? 'Check' : 'Copy'" class="h-3 w-3" :class="copiedField === 'data_object' ? 'text-emerald-500' : ''" />
              {{ copiedField === 'data_object' ? t('documents.copied') : t('documents.copy') }}
            </button>
          </div>
          <div class="mt-2 max-h-48 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50/80 p-3 dark:border-darkmode-500 dark:bg-darkmode-700/50">
            <pre class="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ prettyJson(selectedLog.data_object) }}</pre>
          </div>
        </div>

        <!-- Information -->
        <div v-if="selectedLog.information" class="mt-4">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{{ t('job-log.information') }}</span>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-darkmode-600 dark:hover:text-slate-300"
              @click="copyValue('information', selectedLog.information)"
            >
              <Lucide :icon="copiedField === 'information' ? 'Check' : 'Copy'" class="h-3 w-3" :class="copiedField === 'information' ? 'text-emerald-500' : ''" />
              {{ copiedField === 'information' ? t('documents.copied') : t('documents.copy') }}
            </button>
          </div>
          <div class="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-150 bg-slate-50/80 p-3 dark:border-darkmode-500 dark:bg-darkmode-700/50">
            <pre class="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">{{ prettyJson(selectedLog.information) }}</pre>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
